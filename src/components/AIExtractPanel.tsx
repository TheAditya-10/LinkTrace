import { useState } from 'react'
import { Sparkles, X, Loader2, TriangleAlert, ArrowRight, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { extractFromText } from '@/lib/extractApi'
import { ExtractionReview } from '@/components/ExtractionReview'
import type { EvidenceSourceType, ExtractionResult } from '@/types'

const sourceTypes: EvidenceSourceType[] = [
  'FIR',
  'CDR',
  'Transaction',
  'Surveillance',
  'Social Media',
  'OCR Scan',
  'Vehicle Registry',
  'Location Log',
]

export function AIExtractPanel() {
  const open = useAppStore((s) => s.aiExtractOpen)
  const setOpen = useAppStore((s) => s.setAiExtractOpen)
  const mergeExtraction = useAppStore((s) => s.mergeExtraction)

  const [text, setText] = useState('')
  const [sourceType, setSourceType] = useState<EvidenceSourceType>('FIR')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [excludedEntities, setExcludedEntities] = useState<Set<string>>(new Set())
  const [excludedRelationships, setExcludedRelationships] = useState<Set<number>>(new Set())
  const [mergedSummary, setMergedSummary] = useState<string | null>(null)

  if (!open) return null

  function reset() {
    setText('')
    setResult(null)
    setError(null)
    setExcludedEntities(new Set())
    setExcludedRelationships(new Set())
    setMergedSummary(null)
  }

  function close() {
    setOpen(false)
    reset()
  }

  async function runExtraction() {
    setError(null)
    setLoading(true)
    try {
      const r = await extractFromText(text, sourceType)
      if (r.entities.length === 0) {
        setError("No entities found in that text — try pasting a more detailed excerpt, or check it isn't empty of names/numbers/places.")
      } else {
        setResult(r)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extraction failed')
    } finally {
      setLoading(false)
    }
  }

  function handleMerge() {
    if (!result) return
    const filteredEntities = result.entities.filter((e) => !excludedEntities.has(e.tempId))
    const includedTempIds = new Set(filteredEntities.map((e) => e.tempId))
    const filteredRelationships = result.relationships.filter(
      (r, i) =>
        !excludedRelationships.has(i) && includedTempIds.has(r.sourceTempId) && includedTempIds.has(r.targetTempId),
    )
    const summary = mergeExtraction(
      { entities: filteredEntities, relationships: filteredRelationships, caseSummary: result.caseSummary },
      text,
      sourceType,
    )
    setMergedSummary(
      `Added ${summary.entitiesAdded} new ${summary.entitiesAdded === 1 ? 'entity' : 'entities'}` +
        (summary.entitiesLinked > 0 ? ` (linked ${summary.entitiesLinked} to existing entities)` : '') +
        ` and ${summary.relationshipsAdded} ${summary.relationshipsAdded === 1 ? 'relationship' : 'relationships'} to this case.`,
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={close} className="absolute inset-0 bg-ink-900/40 backdrop-blur-[1px]" />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-base-border bg-base-surface shadow-panel">
        <div className="flex items-center justify-between border-b border-base-border px-5 py-4">
          <span className="flex items-center gap-2 font-sans text-sm font-bold text-ink-900">
            <Sparkles className="h-4 w-4 text-accent" /> AI Extraction
            <span className="mono-tag">gemini-2.0-flash</span>
          </span>
          <button onClick={close} className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-muted hover:text-ink-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {mergedSummary ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-risk-low/10 text-risk-low">
                <Check className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold text-ink-900">Added to case</p>
              <p className="max-w-sm text-xs text-ink-500">{mergedSummary}</p>
              <p className="text-[11px] text-ink-400">This session only — not persisted to a backend.</p>
              <button
                onClick={close}
                className="mt-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-dim"
              >
                Done
              </button>
            </div>
          ) : !result ? (
            <div className="space-y-4">
              <p className="text-xs text-ink-500">
                Paste a raw excerpt — an FIR paragraph, a CDR summary, a transaction note, a surveillance report — and
                Gemini will extract the entities and relationships it directly supports. Nothing is added to the case
                until you review and confirm below.
              </p>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-500">Source type</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as EvidenceSourceType)}
                  className="rounded-lg border border-base-border bg-base-muted px-2.5 py-1.5 text-xs text-ink-700 outline-none focus:border-accent/60"
                >
                  {sourceTypes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-500">Text</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  maxLength={6000}
                  placeholder="e.g. On 14 March, surveillance observed Rakesh Gupta meeting Anil Sharma at Blue Moon Café, Andheri. Gupta arrived in a black Honda City, MH-02-XY-1234..."
                  className="w-full resize-none rounded-lg border border-base-border bg-base-muted px-3 py-2 text-xs text-ink-900 outline-none focus:border-accent/60"
                />
                <p className="mt-1 text-right text-[11px] text-ink-400">{text.length}/6000</p>
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-risk-critical/40 bg-risk-critical/5 p-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-risk-critical" />
                  <p className="text-xs text-ink-700">{error}</p>
                </div>
              )}
              <button
                onClick={runExtraction}
                disabled={loading || !text.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Analyzing with Gemini…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Extract entities &amp; relationships
                  </>
                )}
              </button>
            </div>
          ) : (
            <ExtractionReview
              result={result}
              excludedEntities={excludedEntities}
              excludedRelationships={excludedRelationships}
              onToggleEntity={(tempId) =>
                setExcludedEntities((prev) => {
                  const next = new Set(prev)
                  if (next.has(tempId)) next.delete(tempId)
                  else next.add(tempId)
                  return next
                })
              }
              onToggleRelationship={(i) =>
                setExcludedRelationships((prev) => {
                  const next = new Set(prev)
                  if (next.has(i)) next.delete(i)
                  else next.add(i)
                  return next
                })
              }
            />
          )}
        </div>

        {result && !mergedSummary && (
          <div className="flex items-center justify-between border-t border-base-border px-5 py-4">
            <button onClick={reset} className="text-xs font-medium text-ink-500 hover:text-ink-900">
              Discard &amp; start over
            </button>
            <button
              onClick={handleMerge}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-dim"
            >
              Add to case <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
