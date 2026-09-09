import type { EvidenceSourceType, ExtractionResult } from '@/types'

interface ExtractOptions {
  text?: string
  sourceType: EvidenceSourceType
  file?: File
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // strip the "data:application/pdf;base64," prefix
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export async function extractFromSource(opts: ExtractOptions): Promise<ExtractionResult> {
  const payload: Record<string, unknown> = { text: opts.text ?? '', sourceType: opts.sourceType }
  if (opts.file) {
    payload.fileBase64 = await readFileAsBase64(opts.file)
    payload.fileMimeType = opts.file.type || 'application/pdf'
  }

  const res = await fetch('/api/extract-entities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string })
    throw new Error(body.error ?? `Extraction failed (${res.status})`)
  }

  return res.json()
}

export async function extractFromText(text: string, sourceType: EvidenceSourceType): Promise<ExtractionResult> {
  return extractFromSource({ text, sourceType })
}
