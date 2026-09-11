// Vercel Function (Node runtime — Neon driver + persistence). Lists cases with
// aggregate counts, or creates a new one.
//
// Node-runtime functions need named HTTP-method exports (GET/POST) with the
// Web-standard Request/Response signature — a `export default (req) => Response`
// is silently ignored (that shape only works on the Edge runtime).
import { listCases, createCase } from '../src/server/caseRepo.js'

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function GET(): Promise<Response> {
  const cases = await listCases()
  return json(cases, 200)
}

export async function POST(req: Request): Promise<Response> {
  let body: { name?: string; caseNumber?: string; jurisdiction?: string; leadInvestigator?: string; summary?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const name = (body.name ?? '').trim()
  if (!name) return json({ error: 'Case name is required' }, 400)
  const caseNumber = (body.caseNumber ?? '').trim() || `CASE/${new Date().getFullYear()}/${Math.floor(Math.random() * 9000 + 1000)}`

  try {
    const created = await createCase({
      name,
      caseNumber,
      jurisdiction: (body.jurisdiction ?? '').trim(),
      leadInvestigator: (body.leadInvestigator ?? '').trim(),
      summary: (body.summary ?? '').trim(),
    })
    return json(created, 201)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create case'
    const isDuplicate = message.includes('duplicate key') && message.includes('case_number')
    return json({ error: isDuplicate ? `Case number "${caseNumber}" is already in use.` : message }, isDuplicate ? 409 : 500)
  }
}
