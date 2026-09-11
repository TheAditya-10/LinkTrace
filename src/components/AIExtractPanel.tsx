import { useRef, useState } from 'react'
import { Sparkles, X, Loader2, TriangleAlert, ArrowRight, Check, FileText, Upload } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { extractFromText } from '@/lib/extractApi'
import { uploadDocument } from '@/lib/documentApi'
import { entityIcon, entityColorVar, entityLabel } from '@/lib/entityMeta'
import { Overlay } from '@/components/ui/Overlay'
import { cn } from '@/lib/utils'
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

type Mode = 'text' | 'pdf'

export function AIExtractPanel() {
  const open = useAppStore((s) => s.aiExtractOpen)
  const setOpen = useAppStore((s) => s.setAiExtractOpen)
  const mergeExtraction = useAppStore((s) => s.mergeExtraction)
  const caseId = useAppStore((s) => s.activeCaseData?.case.id)

  const [mode, setMode] = useState<Mode>('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sourceType, setSourceType] = useState<EvidenceSourceType>('FIR')
  const [loading, setLoading] = useState(false)
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [excludedEntities, setExcludedEntities] = useState<Set<string>>(new Set())
  const [excludedRelationships, setExcludedRelationships] = useState<Set<number>>(new Set())
  const [mergedSummary, setMergedSummary] = useState<string | null>(null)

  function reset() {
    setMode('text')
    setText('')
    setFile(null)
    setDocumentId(null)
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
      if (mode === 'text') {
        const r = await extractFromText(text, sourceType)
        if (r.entities.length === 0) {
          setError("No entities found in that text — try pasting a more detailed excerpt, or check it isn't empty of names/numbers/places.")
        } else {
          setResult(r)
        }
      } else {
        if (!file || !caseId) return
        const { documentId: docId, result: r } = await uploadDocument(caseId, file, sourceType)
        setDocumentId(docId)
        if (r.entities.length === 0) {
          setError("No entities found in that PDF — check it isn't a blank scan, or try a clearer copy.")
        } else {
          setResult(r)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extraction failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleMerge() {
    if (!result) return
    const filteredEntities = result.entities.filter((e) => !excludedEntities.has(e.tempId))
    const includedTempIds = new Set(filteredEntities.map((e) => e.tempId))
    const filteredRelationships = result.relationships.filter(
      (r, i) =>
        !excludedRelationships.has(i) && includedTempIds.has(r.sourceTempId) && includedTempIds.has(r.targetTempId),
    )
    setMerging(true)
    setError(null)
    try {
      const summary = await mergeExtraction(
        { entities: filteredEntities, relationships: filteredRelationships },
        mode === 'text'
          ? { sourceType, rawText: text }
          : { sourceType, documentId: documentId ?? undefined, documentFilename: file?.name },
      )
      setMergedSummary(
        `Added ${summary.entitiesAdded} new ${summary.entitiesAdded === 1 ? 'entity' : 'entities'}` +
          (summary.entitiesLinked > 0 ? ` (linked ${summary.entitiesLinked} to existing entities)` : '') +
          ` and ${summary.relationshipsAdded} ${summary.relationshipsAdded === 1 ? 'relationship' : 'relationships'} to this case.`,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add extraction to case')
    } finally {
      setMerging(false)
    }
  }

  return (
    <Overlay open={open} onClose={close} variant="modal">
      <div className="flex max-h-[85vh] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-base-border px-5 py-4">
          <span className="flex items-center gap-2 font-sans text-sm font-bold text-ink-900">
            <Sparkles className="h-4 w-4 text-accent" /> AI Extraction
            <span className="mono-tag">gemini-3.6-flash</span>
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
              <p className="text-[11px] text-ink-400">Saved to the case.</p>
              <button
                onClick={close}
                className="mt-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-dim active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          ) : !result ? (
            <div className="space-y-4">
              <div className="flex gap-1 rounded-lg border border-base-border bg-base-muted p-1">
                <button
                  onClick={() => setMode('text')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition',
                    mode === 'text' ? 'bg-base-surface text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900',
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Paste text
                </button>
                <button
                  onClick={() => setMode('pdf')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition',
                    mode === 'pdf' ? 'bg-base-surface text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900',
                  )}
                >
                  <FileText className="h-3.5 w-3.5" /> Upload PDF
                </button>
              </div>

              <p className="text-xs text-ink-500">
                {mode === 'text'
                  ? "Paste a raw excerpt — an FIR paragraph, a CDR summary, a transaction note, a surveillance report — and Gemini will extract the entities and relationships it directly supports."
                  : 'Upload an FIR, call detail record, or other case document as a PDF. Gemini reads the pages directly — including scanned or handwritten ones — and extracts entities and relationships in one pass.'}{' '}
                Nothing is added to the case until you review and confirm below.
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
              {mode === 'text' ? (
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
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-500">PDF document</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-base-border bg-base-muted px-3 py-6 text-center transition hover:border-accent/40"
                  >
                    <Upload className="h-5 w-5 text-ink-400" />
                    {file ? (
                      <span className="text-xs font-medium text-ink-900">{file.name}</span>
                    ) : (
                      <span className="text-xs text-ink-500">Click to choose a PDF</span>
                    )}
                  </button>
                </div>
              )}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-risk-critical/40 bg-risk-critical/5 p-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-risk-critical" />
                  <p className="text-xs text-ink-700">{error}</p>
                </div>
              )}
              <button
                onClick={runExtraction}
                disabled={loading || (mode === 'text' ? !text.trim() : !file)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="motion-loading h-4 w-4 animate-spin" />
                    {mode === 'text' ? 'Analyzing with Gemini…' : 'Reading PDF with Gemini…'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Extract entities &amp; relationships
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs text-ink-500">
                Review before adding — uncheck anything that looks wrong. Entities matching an existing label/alias
                will be linked to that entity instead of duplicated.
              </p>

              <section>
                <p className="eyebrow mb-2">Entities ({result.entities.length})</p>
                <div className="space-y-1.5">
                  {result.entities.map((e) => {
                    const Icon = entityIcon[e.type]
                    const excluded = excludedEntities.has(e.tempId)
                    return (
                      <label
                        key={e.tempId}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${
                          excluded ? 'border-base-border bg-base-muted opacity-50' : 'border-base-border bg-base-surface'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!excluded}
                          onChange={() =>
                            setExcludedEntities((prev) => {
                              const next = new Set(prev)
                              if (next.has(e.tempId)) next.delete(e.tempId)
                              else next.add(e.tempId)
                              return next
                            })
                          }
                          className="accent-accent"
                        />
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${entityColorVar[e.type]}1a`, color: entityColorVar[e.type] }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium text-ink-900">{e.label}</span>
                          <span className="block text-[11px] text-ink-400">
                            {entityLabel[e.type]}
                            {e.aliases.length > 0 && ` · aka ${e.aliases.join(', ')}`}
                          </span>
                        </span>
                        <span className="mono-tag shrink-0">{Math.round(e.confidence * 100)}%</span>
                      </label>
                    )
                  })}
                </div>
              </section>

              <section>
                <p className="eyebrow mb-2">Relationships ({result.relationships.length})</p>
                <div className="space-y-1.5">
                  {result.relationships.length === 0 && (
                    <p className="text-xs text-ink-400">No relationships extracted between the entities above.</p>
                  )}
                  {result.relationships.map((r, i) => {
                    const s = result.entities.find((e) => e.tempId === r.sourceTempId)
                    const t = result.entities.find((e) => e.tempId === r.targetTempId)
                    const excluded = excludedRelationships.has(i)
                    return (
                      <label
                        key={i}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition ${
                          excluded ? 'border-base-border bg-base-muted opacity-50' : 'border-base-border bg-base-surface'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!excluded}
                          onChange={() =>
                            setExcludedRelationships((prev) => {
                              const next = new Set(prev)
                              if (next.has(i)) next.delete(i)
                              else next.add(i)
                              return next
                            })
                          }
                          className="mt-0.5 accent-accent"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1 text-xs font-medium text-ink-900">
                            {s?.label ?? '?'} <ArrowRight className="h-3 w-3 text-ink-300" /> {t?.label ?? '?'}
                          </span>
                          <span className="block text-[11px] text-ink-400">
                            {r.type} · {r.description || r.label}
                          </span>
                        </span>
                        <span className="mono-tag shrink-0">{Math.round(r.confidence * 100)}%</span>
                      </label>
                    )
                  })}
                </div>
              </section>
            </div>
          )}
        </div>

        {result && !mergedSummary && (
          <div className="flex items-center justify-between border-t border-base-border px-5 py-4">
            <button onClick={reset} disabled={merging} className="text-xs font-medium text-ink-500 hover:text-ink-900 disabled:opacity-50">
              Discard &amp; start over
            </button>
            <button
              onClick={handleMerge}
              disabled={merging}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {merging ? (
                <>
                  <Loader2 className="motion-loading h-3.5 w-3.5 animate-spin" /> Adding…
                </>
              ) : (
                <>
                  Add to case <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Overlay>
  )
}
