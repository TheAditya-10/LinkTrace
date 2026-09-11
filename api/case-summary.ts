// Vercel Function (Node.js runtime — LangChain needs Node, not Edge). Orchestrates
// a Gemini call through LangChain to turn a case's full entity/relationship/evidence
// graph into a plain-language investigative briefing. The API key never reaches the
// browser bundle. Deployed automatically by Vercel from this file's path — no extra
// config needed beyond the GEMINI_API_KEY project environment variable (same key
// used by /api/extract-entities).
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { z } from 'zod'

const GEMINI_MODEL = 'gemini-3.6-flash'
const MAX_EVIDENCE = 24
const MAX_TIMELINE = 30
const MAX_EXCERPT_CHARS = 500

const caseSummarySchema = z.object({
  headline: z.string().describe('One plain-language sentence: what this case is and where it stands.'),
  originEntityId: z
    .string()
    .describe(
      'The id (from the ENTITIES list) of the person the investigation started from — usually the victim, the ' +
        'complainant, or whoever\'s report opened the case. Exactly one id from the list, or the literal string ' +
        '"none" if none fits — Gemini\'s structured-output schema does not support a nullable field here.',
    ),
  originReason: z.string().describe('One or two sentences on why that entity marks the start of the investigation.'),
  firSummary: z
    .string()
    .describe('Who filed the first report (FIR or equivalent), when, and what it said — drawn from the evidence given.'),
  narrative: z
    .array(z.string())
    .min(1)
    .max(8)
    .describe(
      'The case told as a short chronological story an officer can read instead of the graph — 3-6 self-contained ' +
        'paragraphs in plain investigative language, not a list of nodes and edges.',
    ),
  keyPersons: z
    .array(
      z.object({
        entityId: z.string().describe('id taken exactly from the ENTITIES list'),
        role: z.string().describe('e.g. Victim, Accused, Witness, Investigating officer'),
        note: z.string().describe('One sentence on why this person matters to the case'),
      }),
    )
    .max(12)
    .describe('Only the people an officer actually needs to know, most important first.'),
  majorMovements: z
    .array(
      z.object({
        date: z.string().describe('date or date/time as given in the source data'),
        description: z.string(),
      }),
    )
    .max(20)
    .describe('The handful of dates/events that actually moved the case forward, in chronological order.'),
  currentStatus: z.string().describe('Where the case stands right now and what the immediate next step is.'),
})

type CaseSummaryResult = z.infer<typeof caseSummarySchema>

interface WireEntity {
  id: string
  type: string
  label: string
  aliases: string[]
  attributes: Record<string, string>
  riskScore: number
}
interface WireRelationship {
  sourceId: string
  targetId: string
  type: string
  label: string
  description: string
  predicted: boolean
}
interface WireEvidence {
  sourceType: string
  title: string
  excerpt: string
  timestamp: string
  reliability: string
}
interface WireTimelineEvent {
  timestamp: string
  title: string
  description: string
}
interface WireCase {
  name: string
  caseNumber: string
  status: string
  jurisdiction: string
  leadInvestigator: string
  summary: string
  openedDate: string
}
interface RequestBody {
  case?: WireCase
  entities?: WireEntity[]
  relationships?: WireRelationship[]
  evidence?: WireEvidence[]
  timeline?: WireTimelineEvent[]
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function truncate(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max)}…` : s
}

function buildPrompt(body: {
  case: WireCase
  entities: WireEntity[]
  relationships: WireRelationship[]
  evidence: WireEvidence[]
  timeline: WireTimelineEvent[]
}) {
  const entityLines = body.entities
    .map((e) => {
      const role = Object.entries(e.attributes).find(([k]) => k.toLowerCase() === 'role')?.[1]
      const attrs = Object.entries(e.attributes)
        .filter(([k]) => k.toLowerCase() !== 'role')
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ')
      return `- id=${e.id} | ${e.type} | "${e.label}"${e.aliases.length ? ` (aka ${e.aliases.join(', ')})` : ''}${
        role ? ` | role=${role}` : ''
      } | risk=${e.riskScore}${attrs ? ` | ${attrs}` : ''}`
    })
    .join('\n')

  const relationshipLines = body.relationships
    .map(
      (r) =>
        `- ${r.sourceId} -[${r.type}${r.predicted ? ', predicted' : ''}]-> ${r.targetId}: ${r.label}. ${r.description}`,
    )
    .join('\n')

  const evidenceLines = body.evidence
    .slice(0, MAX_EVIDENCE)
    .map(
      (ev) =>
        `- [${ev.timestamp}] (${ev.sourceType}, ${ev.reliability}) ${ev.title}: ${truncate(ev.excerpt, MAX_EXCERPT_CHARS)}`,
    )
    .join('\n')

  const timelineLines = body.timeline
    .slice(-MAX_TIMELINE)
    .map((t) => `- [${t.timestamp}] ${t.title}: ${t.description}`)
    .join('\n')

  return `You are briefing a police officer who has never seen this case's link-analysis graph and does not have time to read it. Turn the structured case data below into a short, plain-language investigative briefing they can act on.

CASE
Name: ${body.case.name} (${body.case.caseNumber})
Status: ${body.case.status} | Jurisdiction: ${body.case.jurisdiction} | Lead investigator: ${body.case.leadInvestigator}
Opened: ${body.case.openedDate}
Existing summary on file: ${body.case.summary}

ENTITIES (id | type | label | role | risk score | other attributes)
${entityLines || '(none)'}

RELATIONSHIPS (source -[type]-> target: label. description)
${relationshipLines || '(none)'}

EVIDENCE
${evidenceLines || '(none)'}

TIMELINE
${timelineLines || '(none)'}

Instructions:
- originEntityId must be exactly one id from the ENTITIES list above (or the literal string "none" if genuinely none fits) — the person this investigation started from.
- firSummary must be grounded in the EVIDENCE and ENTITIES above — do not invent who filed it or what it said.
- narrative is the story of the investigation in chronological order: what happened, who got pulled in, what evidence changed the picture.
- keyPersons ids must be taken exactly from the ENTITIES list above.
- majorMovements should be ordered chronologically.
- Base every claim strictly on the data given above. Do not invent names, dates, or facts that are not present or strongly implied.`
}

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return json({ error: 'Server is not configured with GEMINI_API_KEY.' }, 500)

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.case || !Array.isArray(body.entities) || body.entities.length === 0) {
    return json({ error: 'A case with at least one entity is required' }, 400)
  }

  const entities = body.entities
  const relationships = Array.isArray(body.relationships) ? body.relationships : []
  const evidence = Array.isArray(body.evidence) ? body.evidence : []
  const timeline = Array.isArray(body.timeline) ? body.timeline : []
  const validEntityIds = new Set(entities.map((e) => e.id))

  const model = new ChatGoogleGenerativeAI({ apiKey, model: GEMINI_MODEL, temperature: 0.3 })
  const structuredModel = model.withStructuredOutput(caseSummarySchema)

  let result: CaseSummaryResult
  try {
    result = await structuredModel.invoke(buildPrompt({ case: body.case, entities, relationships, evidence, timeline }))
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Gemini request failed' }, 502)
  }

  const originEntityId = result.originEntityId && validEntityIds.has(result.originEntityId) ? result.originEntityId : null
  const keyPersons = result.keyPersons.map((p) => ({
    ...p,
    entityId: validEntityIds.has(p.entityId) ? p.entityId : null,
  }))

  return json({ ...result, originEntityId, keyPersons, generatedAt: new Date().toISOString() }, 200)
}
