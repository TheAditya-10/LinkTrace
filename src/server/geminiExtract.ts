// Shared Gemini entity/relationship extraction — used by both the paste-text
// flow and the PDF-upload flow (api/extract-entities.ts). For PDFs, the file
// is sent directly to Gemini as inline multimodal input: Gemini reads scanned/
// handwritten pages (OCR) and extracts entities/relationships in the same call,
// so no separate OCR library is involved.
import type { EntityType, ExtractionResult, RelationshipType } from '../types/index.js'

const ENTITY_TYPES: EntityType[] = ['person', 'phone', 'vehicle', 'location', 'organization', 'event', 'account']
const RELATIONSHIP_TYPES: RelationshipType[] = [
  'call',
  'transaction',
  'meeting',
  'association',
  'ownership',
  'co-occurrence',
  'movement',
  'family',
  'employment',
]
export const MAX_TEXT_CHARS = 6000
export const MAX_PDF_BYTES = 15 * 1024 * 1024 // Gemini inline-data request size headroom
const GEMINI_MODEL = 'gemini-3.6-flash'

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    entities: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          tempId: { type: 'STRING' },
          type: { type: 'STRING', enum: ENTITY_TYPES },
          label: { type: 'STRING' },
          aliases: { type: 'ARRAY', items: { type: 'STRING' } },
          attributes: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: { key: { type: 'STRING' }, value: { type: 'STRING' } },
              required: ['key', 'value'],
            },
          },
          confidence: { type: 'NUMBER' },
        },
        required: ['tempId', 'type', 'label', 'confidence'],
      },
    },
    relationships: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          sourceTempId: { type: 'STRING' },
          targetTempId: { type: 'STRING' },
          type: { type: 'STRING', enum: RELATIONSHIP_TYPES },
          label: { type: 'STRING' },
          description: { type: 'STRING' },
          confidence: { type: 'NUMBER' },
        },
        required: ['sourceTempId', 'targetTempId', 'type', 'label', 'description', 'confidence'],
      },
    },
  },
  required: ['entities', 'relationships'],
}

const INSTRUCTIONS = (sourceType: string) => `You are an evidence-extraction assistant for a police investigative link-analysis tool.

Extract ONLY entities and relationships that are directly and explicitly supported by the material below. Do not invent facts, dates, or connections that are not stated or very strongly implied. If you are unsure whether something qualifies, leave it out rather than guess.

Allowed entity types: ${ENTITY_TYPES.join(', ')}
Allowed relationship types: ${RELATIONSHIP_TYPES.join(', ')}. If a connection is clearly stated but doesn't fit any specific type, use "association".

Source document type: ${sourceType}

Important — for every "person" entity, check whether the material characterizes their role in the case (e.g. it names them as the complainant who filed the report, the victim, deceased, injured party, survivor, an accused/suspect, or a witness). When it does, add an attribute with key "Role" and a value drawn from how the document itself describes them (e.g. "Victim", "Complainant", "Deceased", "Accused", "Witness"). This is critical for surfacing whoever the investigation started from — don't skip it when the text supports it, but don't guess a role when the text doesn't say.

Assign each entity a short tempId ("e1", "e2", ...). Each relationship must reference the tempIds of the two entities it connects. "confidence" is your own calibrated 0–1 estimate of how directly the material supports that entity or relationship existing — do not default everything to 1.`

function clamp01(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0.5
  return Math.max(0, Math.min(1, v))
}

function sanitize(parsed: unknown): ExtractionResult {
  const obj = (parsed ?? {}) as { entities?: unknown[]; relationships?: unknown[] }
  const rawEntities = Array.isArray(obj.entities) ? obj.entities : []
  const rawRelationships = Array.isArray(obj.relationships) ? obj.relationships : []

  const validTempIds = new Set<string>()
  const entities = rawEntities
    .map((e) => e as Record<string, unknown>)
    .filter((e) => typeof e.tempId === 'string' && typeof e.label === 'string' && e.label.trim())
    .map((e) => {
      const tempId = e.tempId as string
      validTempIds.add(tempId)
      const type = ENTITY_TYPES.includes(e.type as EntityType) ? (e.type as EntityType) : 'person'
      const aliases = Array.isArray(e.aliases) ? e.aliases.filter((a): a is string => typeof a === 'string') : []
      const attributes = Array.isArray(e.attributes)
        ? e.attributes
            .map((a) => a as Record<string, unknown>)
            .filter((a) => typeof a.key === 'string' && typeof a.value === 'string')
            .map((a) => ({ key: a.key as string, value: a.value as string }))
        : []
      return { tempId, type, label: (e.label as string).trim(), aliases, attributes, confidence: clamp01(e.confidence) }
    })
    .slice(0, 40)

  const relationships = rawRelationships
    .map((r) => r as Record<string, unknown>)
    .filter(
      (r) =>
        typeof r.sourceTempId === 'string' &&
        typeof r.targetTempId === 'string' &&
        validTempIds.has(r.sourceTempId as string) &&
        validTempIds.has(r.targetTempId as string) &&
        r.sourceTempId !== r.targetTempId,
    )
    .map((r) => ({
      sourceTempId: r.sourceTempId as string,
      targetTempId: r.targetTempId as string,
      type: RELATIONSHIP_TYPES.includes(r.type as RelationshipType) ? (r.type as RelationshipType) : 'association',
      label: typeof r.label === 'string' && r.label.trim() ? r.label.trim() : 'connected to',
      description: typeof r.description === 'string' ? r.description : '',
      confidence: clamp01(r.confidence),
    }))
    .slice(0, 60)

  return { entities, relationships }
}

async function callGemini(parts: Record<string, unknown>[]): Promise<ExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Server is not configured with GEMINI_API_KEY.')

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Gemini request failed (${res.status}): ${errText.slice(0, 500)}`)
  }

  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) throw new Error('Gemini returned no content')

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Gemini returned malformed JSON')
  }
  return sanitize(parsed)
}

export async function extractFromText(text: string, sourceType: string): Promise<ExtractionResult> {
  return callGemini([{ text: `${INSTRUCTIONS(sourceType)}\n\nText:\n"""\n${text}\n"""` }])
}

export async function extractFromPdf(pdfBase64: string, sourceType: string): Promise<ExtractionResult> {
  return callGemini([
    { text: `${INSTRUCTIONS(sourceType)}\n\nThe material is the attached PDF document. Read every page, including scanned/handwritten pages, before extracting.` },
    { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
  ])
}
