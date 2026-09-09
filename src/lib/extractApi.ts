import type { EvidenceSourceType, ExtractionResult } from '@/types'

export async function extractFromText(text: string, sourceType: EvidenceSourceType): Promise<ExtractionResult> {
  const res = await fetch('/api/extract-entities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sourceType }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string })
    throw new Error(body.error ?? `Extraction failed (${res.status})`)
  }

  return res.json()
}
