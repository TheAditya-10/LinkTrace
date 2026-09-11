// Vercel Function (Node runtime — Blob SDK + Buffer). Accepts a raw PDF body,
// stores it in Vercel Blob (private), and runs it straight through Gemini for
// OCR + entity/relationship extraction. Returns the raw ExtractionResult for
// client-side review — persisting it is a separate step (/api/merge-extraction)
// so the analyst can review/exclude before it's written to the case.
import { put } from '@vercel/blob'
import { createDocument, updateDocumentStatus } from '../src/server/documentsRepo.js'
import { extractFromPdf, MAX_PDF_BYTES } from '../src/server/geminiExtract.js'
import type { EvidenceSourceType } from '../src/types/index.js'

const evidenceSourceTypes = new Set<EvidenceSourceType>([
  'FIR',
  'CDR',
  'Transaction',
  'Surveillance',
  'Social Media',
  'OCR Scan',
  'Vehicle Registry',
  'Location Log',
])

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const caseId = searchParams.get('caseId')
  const requestedFilename = searchParams.get('filename') || 'document.pdf'
  const filename = requestedFilename.split(/[\\/]/).pop()?.replace(/[\p{Cc}]/gu, '').slice(0, 200) || 'document.pdf'
  const requestedSourceType = searchParams.get('sourceType') || 'FIR'
  if (!caseId) return json({ error: 'caseId query param is required' }, 400)
  if (!evidenceSourceTypes.has(requestedSourceType as EvidenceSourceType)) return json({ error: 'Invalid source type' }, 400)
  const sourceType = requestedSourceType as EvidenceSourceType

  const buffer = Buffer.from(await req.arrayBuffer())
  if (buffer.byteLength === 0) return json({ error: 'Empty file body' }, 400)
  if (buffer.byteLength > MAX_PDF_BYTES) {
    return json({ error: `File too large (max ${Math.round(MAX_PDF_BYTES / (1024 * 1024))}MB)` }, 400)
  }
  if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') return json({ error: 'File must be a valid PDF' }, 400)

  const blob = await put(`cases/${caseId}/${filename}`, buffer, {
    access: 'private',
    addRandomSuffix: true,
    contentType: 'application/pdf',
  })

  const document = await createDocument({ caseId, blobUrl: blob.url, pathname: blob.pathname, filename, sourceType })

  try {
    const result = await extractFromPdf(buffer.toString('base64'), sourceType)
    await updateDocumentStatus(document.id, 'processing')
    return json({ documentId: document.id, result }, 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'PDF extraction failed'
    await updateDocumentStatus(document.id, 'error', { errorMessage: message })
    return json({ documentId: document.id, error: message }, 502)
  }
}
