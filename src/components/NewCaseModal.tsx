import { useRef, useState } from 'react'
import { FolderPlus, X, Sparkles, Loader2, TriangleAlert, Paperclip, FileText, XCircle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { extractFromSource } from '@/lib/extractApi'
import { ExtractionReview } from '@/components/ExtractionReview'
import { cn } from '@/lib/utils'
import type { CaseStatus, EvidenceSourceType, ExtractionResult, RiskLevel } from '@/types'

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

interface NewCaseModalProps {
  open: boolean
  onClose: () => void
  onCreated: (caseId: string) => void
}

function suggestCaseNumber() {
  const now = new Date()
  const rand = Math.floor(100 + Math.random() * 900)
  return `CASE/${now.getFullYear()}/${rand}`
}

export function NewCaseModal({ open, onClose, onCreated }: NewCaseModalProps) {
  const investigatorName = useAppStore((s) => s.investigatorName)
  const createCase = useAppStore((s) => s.createCase)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [caseNumber, setCaseNumber] = useState(suggestCaseNumber)
  const [jurisdiction, setJurisdiction] = useState('')
  const [leadInvestigator, setLeadInvestigator] = useState(investigatorName ?? '')
  const [status, setStatus] = useState<CaseStatus>('active')
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('medium')
  const [crimeSummary, setCrimeSummary] = useState('')

  const [sourceType, setSourceType] = useState<EvidenceSourceType>('FIR')
  const [sourceText, setSourceText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null)
  const [excludedEntities, setExcludedEntities] = useState<Set<string>>(new Set())
  const [excludedRelationships, setExcludedRelationships] = useState<Set<number>>(new Set())
  const [formError, setFormError] = useState<string | null>(null)

  if (!open) return null

  function resetAll() {
    setName('')
    setCaseNumber(suggestCaseNumber())
    setJurisdiction('')
    setLeadInvestigator(investigatorName ?? '')
    setStatus('active')
    setRiskLevel('medium')
    setCrimeSummary('')
    setSourceText('')
    setFile(null)
    setExtraction(null)
    setExtractError(null)
    setExcludedEntities(new Set())
    setExcludedRelationships(new Set())
    setFormError(null)
  }

  function close() {
    onClose()
    resetAll()
  }

  async function runExtraction() {
    if (!sourceText.trim() && !file) return
    setExtractError(null)
    setExtracting(true)
    try {
      const r = await extractFromSource({ text: sourceText, sourceType, file: file ?? undefined })
      setExtraction(r)
      setExcludedEntities(new Set())
      setExcludedRelationships(new Set())
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : 'Extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  function handleCreate() {
    if (!name.trim() || !caseNumber.trim() || !jurisdiction.trim() || !leadInvestigator.trim() || !crimeSummary.trim()) {
      setFormError('Case name, number, jurisdiction, lead investigator, and crime summary are all required.')
      return
    }
    setFormError(null)

    let initialExtraction: ExtractionResult | undefined
    if (extraction) {
      const filteredEntities = extraction.entities.filter((e) => !excludedEntities.has(e.tempId))
      const includedTempIds = new Set(filteredEntities.map((e) => e.tempId))
      const filteredRelationships = extraction.relationships.filter(
        (r, i) =>
          !excludedRelationships.has(i) && includedTempIds.has(r.sourceTempId) && includedTempIds.has(r.targetTempId),
      )
      initialExtraction = { entities: filteredEntities, relationships: filteredRelationships, caseSummary: extraction.caseSummary }
    }

    const newCaseId = createCase({
      name: name.trim(),
      caseNumber: caseNumber.trim(),
      jurisdiction: jurisdiction.trim(),
      leadInvestigator: leadInvestigator.trim(),
      status,
      riskLevel,
      crimeSummary: crimeSummary.trim(),
      initialExtraction,
      initialSourceText: sourceText,
      initialSourceType: sourceType,
      initialSourceLabel: file ? `Initial ${sourceType} — ${file.name}` : `Initial ${sourceType} ingestion`,
    })
    onCreated(newCaseId)
    resetAll()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={close} className="absolute inset-0 bg-ink-900/40 backdrop-blur-[1px]" />
      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-base-border bg-base-surface shadow-panel">
        <div className="flex items-center justify-between border-b border-base-border px-5 py-4">
          <span className="flex items-center gap-2 font-sans text-sm font-bold text-ink-900">
            <FolderPlus className="h-4 w-4 text-accent" /> New Case
          </span>
          <button onClick={close} className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-muted hover:text-ink-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Case name" required>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Operation Nightfall"
                  className="w-full rounded-lg border border-base-border bg-base-muted px-3 py-2 text-sm text-ink-900 outline-none focus:border-accent/60"
                />
              </Field>
              <Field label="Case number" required>
                <input
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full rounded-lg border border-base-border bg-base-muted px-3 py-2 text-sm text-ink-900 outline-none focus:border-accent/60"
                />
              </Field>
              <Field label="Jurisdiction" required>
                <input
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="e.g. Delhi Police, Cyber Cell"
                  className="w-full rounded-lg border border-base-border bg-base-muted px-3 py-2 text-sm text-ink-900 outline-none focus:border-accent/60"
                />
              </Field>
              <Field label="Lead investigator" required>
                <input
                  value={leadInvestigator}
                  onChange={(e) => setLeadInvestigator(e.target.value)}
                  className="w-full rounded-lg border border-base-border bg-base-muted px-3 py-2 text-sm text-ink-900 outline-none focus:border-accent/60"
                />
              </Field>
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CaseStatus)}
                  className="w-full rounded-lg border border-base-border bg-base-muted px-3 py-2 text-sm text-ink-900 outline-none focus:border-accent/60"
                >
                  <option value="active">Active</option>
                  <option value="under_review">Under Review</option>
                  <option value="closed">Closed</option>
                </select>
              </Field>
              <Field label="Risk level">
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                  className="w-full rounded-lg border border-base-border bg-base-muted px-3 py-2 text-sm text-ink-900 outline-none focus:border-accent/60"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>
            </div>

            <Field label="Crime summary" required hint="What happened — shown throughout the workspace as the case brief.">
              <div className="flex items-start gap-2">
                <textarea
                  value={crimeSummary}
                  onChange={(e) => setCrimeSummary(e.target.value)}
                  rows={3}
                  placeholder="e.g. A break-in and assault reported at a residence in Sector 12 on the night of..."
                  className="w-full resize-none rounded-lg border border-base-border bg-base-muted px-3 py-2 text-sm text-ink-900 outline-none focus:border-accent/60"
                />
              </div>
              {extraction?.caseSummary && !crimeSummary.trim() && (
                <button
                  onClick={() => setCrimeSummary(extraction.caseSummary)}
                  className="mt-1.5 text-[11px] font-medium text-accent hover:underline"
                >
                  Use Gemini's detected summary: "{extraction.caseSummary}"
                </button>
              )}
            </Field>

            <div className="rounded-lg border border-base-border p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-900">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Seed with initial evidence (optional)
              </p>
              <p className="mb-3 text-[11px] text-ink-500">
                Paste text and/or upload a PDF (e.g. the FIR) — Gemini will extract a starting set of entities and
                relationships for this case, which you can review before creating it.
              </p>

              <div className="space-y-3">
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
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  rows={4}
                  maxLength={6000}
                  placeholder="Paste FIR / evidence text here (optional if uploading a PDF)…"
                  className="w-full resize-none rounded-lg border border-base-border bg-base-muted px-3 py-2 text-xs text-ink-900 outline-none focus:border-accent/60"
                />
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {file ? (
                    <span className="flex items-center gap-1.5 rounded-lg border border-base-border bg-base-muted px-2.5 py-1.5 text-xs text-ink-700">
                      <FileText className="h-3.5 w-3.5 text-accent" /> {file.name}
                      <button onClick={() => setFile(null)} className="text-ink-400 hover:text-risk-critical">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-lg border border-base-border px-2.5 py-1.5 text-xs font-medium text-ink-500 transition hover:border-accent/40 hover:text-accent"
                    >
                      <Paperclip className="h-3.5 w-3.5" /> Attach PDF
                    </button>
                  )}
                  <button
                    onClick={runExtraction}
                    disabled={extracting || (!sourceText.trim() && !file)}
                    className={cn(
                      'ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                      extracting || (!sourceText.trim() && !file)
                        ? 'cursor-not-allowed bg-base-muted text-ink-400'
                        : 'bg-accent text-white hover:bg-accent-dim',
                    )}
                  >
                    {extracting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> Extract preview
                      </>
                    )}
                  </button>
                </div>
                {extractError && (
                  <div className="flex items-start gap-2 rounded-lg border border-risk-critical/40 bg-risk-critical/5 p-2.5">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-risk-critical" />
                    <p className="text-xs text-ink-700">{extractError}</p>
                  </div>
                )}
              </div>

              {extraction && (
                <div className="mt-4 border-t border-base-border pt-4">
                  <ExtractionReview
                    result={extraction}
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
                </div>
              )}
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-risk-critical/40 bg-risk-critical/5 p-3">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-risk-critical" />
                <p className="text-xs text-ink-700">{formError}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-base-border px-5 py-4">
          <button onClick={close} className="text-xs font-medium text-ink-500 hover:text-ink-900">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-dim"
          >
            <FolderPlus className="h-3.5 w-3.5" /> Create case
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink-500">
        {label} {required && <span className="text-risk-critical">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-ink-400">{hint}</p>}
    </div>
  )
}
