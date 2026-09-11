// Vercel Function (Node runtime). Returns the full CaseData for one case,
// reconstructed from Postgres — replaces the old fixture-backed getCaseDataById.
import { getCaseData } from '../src/server/caseRepo.js'

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return json({ error: 'id query param is required' }, 400)

  const data = await getCaseData(id)
  if (!data) return json({ error: `Unknown case: ${id}` }, 404)
  return json(data, 200)
}
