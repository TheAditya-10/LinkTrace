// Vercel Edge Function. Proxies a Gemini call server-side so the API key
// never reaches the browser bundle. Deployed automatically by Vercel from
// this file's path — no extra config needed beyond setting GEMINI_API_KEY
// as a project environment variable.
export const config = { runtime: 'edge' }

const ENTITY_TYPES = ['person', 'phone', 'vehicle', 'location', 'organization', 'event', 'account']
const RELATIONSHIP_TYPES = [
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
const MAX_INPUT_CHARS = 6000
const GEMINI_MODEL = 'gemini-2.0-flash'

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

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function buildPrompt(text: string, sourceType: string) {
  return `You are an evidence-extraction assistant for a police investigative link-analysis tool.

Extract ONLY entities and relationships that are directly and explicitly supported by the text below. Do not invent facts, dates, or connections that are not stated or very strongly implied. If you are unsure whether something qualifies, leave it out rather than guess.

Allowed entity types: ${ENTITY_TYPES.join(', ')}
Allowed relationship types: ${RELATIONSHIP_TYPES.join(', ')}. If a connection is clearly stated but doesn't fit any specific type, use "association".

Source document type: ${sourceType}

Text:
"""
${text}
"""

Assign each entity a short tempId ("e1", "e2", ...). Each relationship must reference the tempIds of the two entities it connects. "confidence" is your own calibrated 0–1 estimate of how directly the text supports that entity or relationship existing — do not default everything to 1.`
}

function clamp01(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0.5
  return Math.max(0, Math.min(1, v))
}

function sanitize(parsed: unknown) {
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
      const type = ENTITY_TYPES.includes(e.type as string) ? (e.type as string) : 'person'
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
      type: RELATIONSHIP_TYPES.includes(r.type as string) ? (r.type as string) : 'association',
      label: typeof r.label === 'string' && r.label.trim() ? r.label.trim() : 'connected to',
      description: typeof r.description === 'string' ? r.description : '',
      confidence: clamp01(r.confidence),
    }))
    .slice(0, 60)

  return { entities, relationships }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return json({ error: 'Server is not configured with GEMINI_API_KEY.' }, 500)

  let body: { text?: string; sourceType?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const text = (body.text ?? '').trim()
  const sourceType = typeof body.sourceType === 'string' ? body.sourceType : 'FIR'
  if (!text) return json({ error: 'Text is required' }, 400)
  if (text.length > MAX_INPUT_CHARS) return json({ error: `Text too long (max ${MAX_INPUT_CHARS} characters)` }, 400)

  let geminiRes: Response
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: buildPrompt(text, sourceType) }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      },
    )
  } catch {
    return json({ error: 'Could not reach Gemini API' }, 502)
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => '')
    return json({ error: `Gemini request failed (${geminiRes.status})`, detail: errText.slice(0, 500) }, 502)
  }

  const data = (await geminiRes.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) return json({ error: 'Gemini returned no content' }, 502)

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return json({ error: 'Gemini returned malformed JSON' }, 502)
  }

  return json(sanitize(parsed), 200)
}
