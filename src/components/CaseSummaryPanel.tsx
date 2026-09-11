import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, FileText, Loader2, RefreshCw, Siren, TriangleAlert } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { entityIcon, entityColorVar, ORIGIN_COLOR } from '@/lib/entityMeta'
import { formatDate, formatDateTime, cn } from '@/lib/utils'

function safeFormatDate(raw: string): string {
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? raw : formatDate(raw)
}

export function CaseSummaryPanel() {
  const [open, setOpen] = useState(true)
  const activeCaseData = useAppStore((s) => s.activeCaseData)
  const selectEntity = useAppStore((s) => s.selectEntity)
  const summary = useAppStore((s) => s.caseSummary)
  const loading = useAppStore((s) => s.caseSummaryLoading)
  const error = useAppStore((s) => s.caseSummaryError)
  const generate = useAppStore((s) => s.generateCaseSummary)

  if (!activeCaseData) return null

  const entityById = new Map(activeCaseData.entities.map((e) => [e.id, e]))
  const originEntity = summary?.originEntityId ? entityById.get(summary.originEntityId) : undefined

  function EntityChip({ entityId, fallbackLabel }: { entityId: string | null; fallbackLabel: string }) {
    const entity = entityId ? entityById.get(entityId) : undefined
    if (!entity) return <span className="font-medium text-ink-900">{fallbackLabel}</span>
    const Icon = entityIcon[entity.type]
    return (
      <button
        onClick={() => selectEntity(entity.id)}
        className="inline-flex items-center gap-1 rounded-full border border-base-border bg-base-muted px-1.5 py-0.5 font-medium text-ink-900 transition hover:border-accent/40 hover:text-accent"
      >
        <Icon className="h-3 w-3" style={{ color: entityColorVar[entity.type] }} />
        {entity.label}
      </button>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden border-l border-base-border bg-base-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full shrink-0 items-center justify-between px-4 py-3.5 text-sm font-semibold text-ink-900"
      >
        <span className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" /> Case Briefing
        </span>
        <ChevronDown className={cn('h-4 w-4 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-base-border"
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="mono-tag">gemini-3.6-flash · langchain</span>
                {summary && (
                  <button
                    onClick={() => generate()}
                    disabled={loading}
                    title="Regenerate briefing"
                    className="flex items-center gap-1 text-[11px] font-medium text-ink-400 transition hover:text-accent disabled:opacity-50"
                  >
                    <RefreshCw className={cn('h-3 w-3', loading && 'motion-loading animate-spin')} /> Refresh
                  </button>
                )}
              </div>

              {!summary && !loading && (
                <div className="space-y-3">
                  <p className="text-xs text-ink-500">
                    Have Gemini read this case's full entity, relationship, and evidence graph and write it up as a
                    plain-language briefing — who this started with, who matters, and what moved the case forward — so
                    an officer can read it instead of the graph.
                  </p>
                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-risk-critical/40 bg-risk-critical/5 p-3">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-risk-critical" />
                      <p className="text-xs text-ink-700">{error}</p>
                    </div>
                  )}
                  <button
                    onClick={() => generate()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-accent-dim active:scale-[0.98]"
                  >
                    <FileText className="h-3.5 w-3.5" /> Generate case briefing
                  </button>
                </div>
              )}

              {loading && (
                <div className="motion-loading flex flex-col items-center gap-2 py-10 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  <p className="text-xs text-ink-500">Reading the case graph with Gemini…</p>
                </div>
              )}

              {summary && !loading && (
                <div className="space-y-5">
                  <section>
                    <p className="eyebrow mb-1.5">Briefing</p>
                    <p className="text-sm font-semibold leading-snug text-ink-900">{summary.headline}</p>
                  </section>

                  <section
                    className="space-y-1.5 rounded-lg border p-3"
                    style={{ borderColor: `${ORIGIN_COLOR}55`, backgroundColor: `${ORIGIN_COLOR}0d` }}
                  >
                    <p
                      className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: ORIGIN_COLOR }}
                    >
                      <Siren className="h-3.5 w-3.5" /> Investigation origin
                    </p>
                    <p className="text-xs text-ink-700">
                      <EntityChip entityId={summary.originEntityId} fallbackLabel="Not identified from the case data" />
                      {originEntity && ' — '}
                      {summary.originReason}
                    </p>
                  </section>

                  <section>
                    <p className="eyebrow mb-1.5">First report</p>
                    <p className="text-xs leading-relaxed text-ink-700">{summary.firSummary}</p>
                  </section>

                  <section>
                    <p className="eyebrow mb-2">What happened</p>
                    <div className="space-y-2.5">
                      {summary.narrative.map((para, i) => (
                        <p key={i} className="text-xs leading-relaxed text-ink-700">
                          {para}
                        </p>
                      ))}
                    </div>
                  </section>

                  <section>
                    <p className="eyebrow mb-2">Key persons ({summary.keyPersons.length})</p>
                    <div className="space-y-1.5">
                      {summary.keyPersons.map((p, i) => (
                        <div key={i} className="rounded-lg border border-base-border px-2.5 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <EntityChip entityId={p.entityId} fallbackLabel={p.role} />
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                              {p.role}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-ink-500">{p.note}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <p className="eyebrow mb-2">Major movements</p>
                    <div className="space-y-3 border-l border-base-border pl-3">
                      {summary.majorMovements.map((m, i) => (
                        <div key={i} className="relative">
                          <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-accent" />
                          <p className="text-[11px] font-medium text-ink-400">{safeFormatDate(m.date)}</p>
                          <p className="text-xs leading-relaxed text-ink-900">{m.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <p className="eyebrow mb-1.5">Current status</p>
                    <p className="text-xs leading-relaxed text-ink-700">{summary.currentStatus}</p>
                  </section>

                  <p className="border-t border-base-border pt-3 text-[10px] leading-relaxed text-ink-400">
                    Generated by Gemini from this case's current graph on {formatDateTime(summary.generatedAt)}. Verify
                    against primary evidence before acting.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
