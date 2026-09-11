// Vercel Edge Function. Proxies a Gemini call server-side so the API key
// never reaches the browser bundle. Deployed automatically by Vercel from
// this file's path — no extra config needed beyond setting GEMINI_API_KEY
// as a project environment variable.
//
// Handles the paste-text flow only — the shared extraction/prompt/schema logic
// lives in src/server/geminiExtract.ts alongside extractFromPdf, used by
// api/upload-document.ts for the PDF-upload flow.
export const config = { runtime: 'edge' }

import { extractFromText, MAX_TEXT_CHARS } from '../src/server/geminiExtract.js'

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { text?: string; sourceType?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const text = (body.text ?? '').trim()
  const sourceType = typeof body.sourceType === 'string' ? body.sourceType : 'FIR'
  if (!text) return json({ error: 'Text is required' }, 400)
  if (text.length > MAX_TEXT_CHARS) return json({ error: `Text too long (max ${MAX_TEXT_CHARS} characters)` }, 400)

  try {
    const result = await extractFromText(text, sourceType)
    return json(result, 200)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Extraction failed' }, 502)
  }
}
