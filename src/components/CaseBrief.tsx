import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X, ScrollText, ShieldAlert } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { entityIcon, entityColorVar, roleColor, roleLabel } from '@/lib/entityMeta'
import type { Entity, EntityRole } from '@/types'

function AccusedCard({ entity, onClick }: { entity: Entity; onClick: () => void }) {
  const Icon = entityIcon[entity.type]
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg border-2 border-risk-critical/40 bg-risk-critical/5 px-2.5 py-2 text-left transition hover:border-risk-critical/70"
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${entityColorVar[entity.type]}1a`, color: entityColorVar[entity.type] }}>
        <Icon className="h-4 w-4" />
        <ShieldAlert className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-risk-critical p-0.5 text-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-ink-900">{entity.label}</span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-wide text-risk-critical">Accused</span>
      </span>
    </button>
  )
}

export function CaseBriefCard() {
  const activeCaseData = useAppStore((s) => s.activeCaseData)
  const selectEntity = useAppStore((s) => s.selectEntity)
  const navigate = useNavigate()
  const { caseId } = useParams()
  const [briefOpen, setBriefOpen] = useState(false)

  if (!activeCaseData) return null
  const accused = activeCaseData.entities.filter((e) => e.role === 'accused')

  function focusEntity(id: string) {
    selectEntity(id)
    navigate(`/case/${caseId}/network`)
  }

  return (
    <div className="border-b border-base-border px-4 py-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="eyebrow">Case Brief</p>
        <button onClick={() => setBriefOpen(true)} className="text-[11px] font-medium text-accent hover:underline">
          View full brief
        </button>
      </div>
      <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-ink-500">{activeCaseData.case.crimeSummary}</p>
      {accused.length > 0 && (
        <div className="space-y-1.5">
          {accused.map((e) => (
            <AccusedCard key={e.id} entity={e} onClick={() => focusEntity(e.id)} />
          ))}
        </div>
      )}
      {briefOpen && <CaseBriefModal onClose={() => setBriefOpen(false)} onFocusEntity={focusEntity} />}
    </div>
  )
}

const roleOrder: EntityRole[] = ['accused', 'suspect', 'victim', 'witness']

function CaseBriefModal({ onClose, onFocusEntity }: { onClose: () => void; onFocusEntity: (id: string) => void }) {
  const activeCaseData = useAppStore((s) => s.activeCaseData)
  if (!activeCaseData) return null
  const { case: c, entities, relationships, evidence, leads } = activeCaseData

  const openLeads = leads.filter((l) => l.priority === 'critical' || l.priority === 'high').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink-900/40 backdrop-blur-[1px]" />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-base-border bg-base-surface shadow-panel">
        <div className="flex items-center justify-between border-b border-base-border px-5 py-4">
          <span className="flex items-center gap-2 font-sans text-sm font-bold text-ink-900">
            <ScrollText className="h-4 w-4 text-accent" /> Case Brief
          </span>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-muted hover:text-ink-900">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div>
            <p className="mono-tag mb-1">{c.caseNumber} · {c.jurisdiction}</p>
            <h2 className="font-sans text-lg font-bold text-ink-900">{c.name}</h2>
          </div>

          <section>
            <p className="eyebrow mb-1.5">What happened</p>
            <p className="text-sm leading-relaxed text-ink-700">{c.crimeSummary}</p>
          </section>

          <section>
            <p className="eyebrow mb-1.5">Investigation status</p>
            <p className="text-sm leading-relaxed text-ink-700">{c.investigationStatus}</p>
          </section>

          <section>
            <p className="eyebrow mb-2">People in this case</p>
            <div className="space-y-1.5">
              {roleOrder.flatMap((role) =>
                entities
                  .filter((e) => e.role === role)
                  .map((e) => {
                    const Icon = entityIcon[e.type]
                    return (
                      <button
                        key={e.id}
                        onClick={() => {
                          onFocusEntity(e.id)
                          onClose()
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg border border-base-border px-2.5 py-2 text-left transition hover:border-accent/40 hover:bg-base-muted"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${entityColorVar[e.type]}1a`, color: entityColorVar[e.type] }}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-900">{e.label}</span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white"
                          style={{ backgroundColor: roleColor[role] }}
                        >
                          {roleLabel[role]}
                        </span>
                      </button>
                    )
                  }),
              )}
              {entities.every((e) => !e.role) && (
                <p className="text-xs text-ink-400">No entity roles (accused/victim/witness) identified yet.</p>
              )}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Entities" value={entities.length} />
            <Stat label="Links" value={relationships.length} />
            <Stat label="Evidence" value={evidence.length} />
            <Stat label="Open leads" value={openLeads} />
          </section>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-base-border bg-base-muted p-2.5 text-center">
      <p className="font-sans text-lg font-bold text-ink-900">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-ink-400">{label}</p>
    </div>
  )
}
