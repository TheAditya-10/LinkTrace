// Vercel Function (Node runtime). Single persistence path for both the
// paste-text flow and the PDF-upload flow: loads the case, folds a reviewed
// ExtractionResult into it via the existing pure mergeExtractionIntoCase
// (src/lib/mergeExtraction.ts — shared with the old session-only client path),
// then writes only the rows that changed.
import { getCaseData, applyMergeToDb } from '../src/server/caseRepo.js'
import { updateDocumentStatus } from '../src/server/documentsRepo.js'
import { mergeExtractionIntoCase } from '../src/lib/mergeExtraction.js'
import type { EvidenceSourceType, ExtractionResult } from '../src/types/index.js'

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(req: Request): Promise<Response> {
  let body: {
    caseId?: string
    result?: ExtractionResult
    rawText?: string
    sourceType?: EvidenceSourceType
    documentId?: string
    documentFilename?: string
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { caseId, result, sourceType, documentId, documentFilename } = body
  if (!caseId || !result || !sourceType) {
    return json({ error: 'caseId, result, and sourceType are required' }, 400)
  }

  const before = await getCaseData(caseId)
  if (!before) return json({ error: `Unknown case: ${caseId}` }, 404)

  const { data: after, summary } = mergeExtractionIntoCase(before, result, {
    sourceType,
    rawText: body.rawText,
    documentFilename,
  })

  try {
    await applyMergeToDb(caseId, before, after)
    if (documentId) {
      await updateDocumentStatus(documentId, 'done', {
        entitiesAdded: summary.entitiesAdded,
        relationshipsAdded: summary.relationshipsAdded,
      })
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to persist extraction'
    if (documentId) await updateDocumentStatus(documentId, 'error', { errorMessage: message })
    return json({ error: message }, 500)
  }

  const refreshed = await getCaseData(caseId)
  return json({ data: refreshed, summary }, 200)
}
