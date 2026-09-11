import type { EvidenceSourceType, ExtractionResult } from '@/types'

export interface UploadDocumentResult {
  documentId: string
  result: ExtractionResult
}

/** Uploads a PDF for a case and runs it straight through Gemini (OCR + extraction). */
export async function uploadDocument(
  caseId: string,
  file: File,
  sourceType: EvidenceSourceType,
): Promise<UploadDocumentResult> {
  const params = new URLSearchParams({ caseId, filename: file.name, sourceType })
  const res = await fetch(`/api/upload-document?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf' },
    body: file,
  })
  const body = await res.json().catch(() => ({}) as { error?: string; documentId?: string; result?: ExtractionResult })
  if (!res.ok) throw new Error(body.error ?? `Document upload failed (${res.status})`)
  if (!body.documentId || !body.result) throw new Error('Document upload returned an invalid response')
  return { documentId: body.documentId, result: body.result }
}
