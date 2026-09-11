import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderPlus, Upload, X, Loader2, Check, TriangleAlert, FileText } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { uploadDocument } from '@/lib/documentApi'
import { Overlay } from '@/components/ui/Overlay'
import { cn } from '@/lib/utils'
import type { EvidenceSourceType } from '@/types'

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

function guessSourceType(filename: string): EvidenceSourceType {
  const n = filename.toLowerCase()
  if (n.includes('cdr') || n.includes('call')) return 'CDR'
  if (n.includes('transaction') || n.includes('txn') || n.includes('bank')) return 'Transaction'
  if (n.includes('surveillance') || n.includes('cctv')) return 'Surveillance'
  if (n.includes('vehicle') || n.includes('rto')) return 'Vehicle Registry'
  if (n.includes('location') || n.includes('tower')) return 'Location Log'
  return 'FIR'
}

interface AttachedFile {
  file: File
  sourceType: EvidenceSourceType
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
  entitiesAdded?: number
}

interface CreateCaseModalProps {
  open: boolean
  onClose: () => void
}

export function CreateCaseModal({ open, onClose }: CreateCaseModalProps) {
  const navigate = useNavigate()
  const createCase = useAppStore((s) => s.createCase)
  const loadCase = useAppStore((s) => s.loadCase)
  const mergeExtraction = useAppStore((s) => s.mergeExtraction)

  const [name, setName] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [leadInvestigator, setLeadInvestigator] = useState('')
  const [summary, setSummary] = useState('')
  const [files, setFiles] = useState<AttachedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [stage, setStage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setName('')
    setJurisdiction('')
    setLeadInvestigator('')
    setSummary('')
    setFiles([])
    setSubmitting(false)
    setStage(null)
    setError(null)
  }

  function close() {
    if (submitting) return
    onClose()
    reset()
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    const next = Array.from(list).map((file) => ({ file, sourceType: guessSourceType(file.name), status: 'pending' as const }))
    setFiles((prev) => [...prev, ...next])
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function setFileSourceType(index: number, sourceType: EvidenceSourceType) {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, sourceType } : f)))
  }

  async function handleSubmit() {
    if (!name.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      setStage('Creating case…')
      const created = await createCase({
        name: name.trim(),
        jurisdiction: jurisdiction.trim(),
        leadInvestigator: leadInvestigator.trim(),
        summary: summary.trim(),
      })
      await loadCase(created.id)

      for (let i = 0; i < files.length; i++) {
        const { file, sourceType } = files[i]
        setStage(`Reading ${file.name}…`)
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'processing' } : f)))
        try {
          const { documentId, result } = await uploadDocument(created.id, file, sourceType)
          const summaryResult = await mergeExtraction(result, { sourceType, documentId, documentFilename: file.name })
          setFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: 'done', entitiesAdded: summaryResult.entitiesAdded } : f)),
          )
        } catch (e) {
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: 'error', error: e instanceof Error ? e.message : 'Failed' } : f,
            ),
          )
        }
      }

      navigate(`/case/${created.id}/network`)
      onClose()
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create case')
      setSubmitting(false)
      setStage(null)
    }
  }

  return (
    <Overlay open={open} onClose={close} variant="modal">
      <div className="flex max-h-[85vh] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-base-border px-5 py-4">
          <span className="flex items-center gap-2 font-sans text-sm font-bold text-ink-900">
            <FolderPlus className="h-4 w-4 text-accent" /> New Case
          </span>
          <button
            onClick={close}
            disabled={submitting}
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-muted hover:text-ink-900 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {submitting ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="motion-loading h-6 w-6 animate-spin text-accent" />
              <p className="text-sm font-semibold text-ink-900">{stage}</p>
              {files.length > 0 && (
                <div className="mt-2 w-full space-y-1.5 text-left">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-base-border px-3 py-2 text-xs">
                      {f.status === 'pending' && <FileText className="h-3.5 w-3.5 shrink-0 text-ink-300" />}
                      {f.status === 'processing' && (
                        <Loader2 className="motion-loading h-3.5 w-3.5 shrink-0 animate-spin text-accent" />
                      )}
                      {f.status === 'done' && <Check className="h-3.5 w-3.5 shrink-0 text-risk-low" />}
                      {f.status === 'error' && <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-risk-critical" />}
                      <span className="min-w-0 flex-1 truncate text-ink-700">{f.file.name}</span>
                      <span className="shrink-0 text-[11px] text-ink-400">
                        {f.status === 'done' && `+${f.entitiesAdded ?? 0} entities`}
                        {f.status === 'error' && (f.error ?? 'Failed')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-500">Case name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Silverline Digital Fraud Syndicate"
                  className="w-full rounded-lg border border-base-border bg-base-muted px-3 py-2 text-xs text-ink-900 outline-none focus:border-accent/60"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-500">Jurisdiction</label>
                  <input
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    placeholder="e.g. Cyber Cell, Mumbai"
                    className="w-full rounded-lg border border-base-border bg-base-muted px-3 py-2 text-xs text-ink-900 outline-none focus:border-accent/60"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-500">Lead investigator</label>
                  <input
                    value={leadInvestigator}
                    onChange={(e) => setLeadInvestigator(e.target.value)}
                    placeholder="e.g. Insp. R. Sharma"
                    className="w-full rounded-lg border border-base-border bg-base-muted px-3 py-2 text-xs text-ink-900 outline-none focus:border-accent/60"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-500">Summary</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  placeholder="Brief description of the case"
                  className="w-full resize-none rounded-lg border border-base-border bg-base-muted px-3 py-2 text-xs text-ink-900 outline-none focus:border-accent/60"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-500">Case documents</label>
                <p className="mb-2 text-[11px] text-ink-400">
                  FIR, call detail records, or other case PDFs. Each one is read directly by Gemini — OCR and entity/
                  relationship extraction happen in the same pass — and folded into this case's graph automatically.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={(e) => addFiles(e.target.files)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-base-border bg-base-muted px-3 py-6 text-center transition hover:border-accent/40"
                >
                  <Upload className="h-5 w-5 text-ink-400" />
                  <span className="text-xs text-ink-500">Click to add one or more PDFs</span>
                </button>
                {files.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-base-border px-2.5 py-1.5">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                        <span className="min-w-0 flex-1 truncate text-xs text-ink-700">{f.file.name}</span>
                        <select
                          value={f.sourceType}
                          onChange={(e) => setFileSourceType(i, e.target.value as EvidenceSourceType)}
                          className="shrink-0 rounded-md border border-base-border bg-base-surface px-1.5 py-1 text-[11px] text-ink-700 outline-none"
                        >
                          {sourceTypes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => removeFile(i)} className="shrink-0 text-ink-300 hover:text-risk-critical">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-risk-critical/40 bg-risk-critical/5 p-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-risk-critical" />
                  <p className="text-xs text-ink-700">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {!submitting && (
          <div className="flex items-center justify-end border-t border-base-border px-5 py-4">
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className={cn(
                'flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-dim active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
            >
              <FolderPlus className="h-3.5 w-3.5" /> Create case
            </button>
          </div>
        )}
      </div>
    </Overlay>
  )
}
