import { useNavigate, useParams } from 'react-router-dom'
import { X, ArrowUpRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { entityIcon, entityColorVar, entityLabel, riskLevelFromScore, riskColor, roleColor, roleLabel } from '@/lib/entityMeta'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import type { Entity } from '@/types'

export function EntityDetailPanel() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const activeCaseData = useAppStore((s) => s.activeCaseData)
  const selectedEntityId = useAppStore((s) => s.selectedEntityId)
  const selectEntity = useAppStore((s) => s.selectEntity)
  const requestFocus = useAppStore((s) => s.requestFocus)

  if (!activeCaseData || !selectedEntityId) return null
  const found = activeCaseData.entities.find((e) => e.id === selectedEntityId)
  if (!found) return null
  const entity: Entity = found

  const relationships = activeCaseData.relationships.filter(
    (r) => r.sourceId === entity.id || r.targetId === entity.id,
  )
  const events = activeCaseData.timeline
    .filter((t) => t.entityIds.includes(entity.id))
    .slice(-6)
    .reverse()

  const Icon = entityIcon[entity.type]
  const color = entityColorVar[entity.type]
  const risk = riskLevelFromScore(entity.riskScore)

  function goToEntity(id: string) {
    selectEntity(id)
  }

  function focusOnMap() {
    requestFocus({ entityId: entity.id })
    navigate(`/case/${caseId}/network`)
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Close"
        onClick={() => selectEntity(null)}
        className="absolute inset-0 bg-ink-900/30 backdrop-blur-[1px]"
      />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-base-border bg-base-surface shadow-panel animate-[slideIn_0.2s_ease-out]">
        <div className="flex items-start justify-between gap-3 border-b border-base-border p-5">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="mb-0.5 flex items-center gap-1.5">
                <p className="eyebrow">{entityLabel[entity.type]}</p>
                {entity.role && (
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white"
                    style={{ backgroundColor: roleColor[entity.role] }}
                  >
                    {roleLabel[entity.role]}
                  </span>
                )}
              </div>
              <h2 className="font-sans text-lg font-bold leading-tight text-ink-900">{entity.label}</h2>
              {entity.aliases.length > 0 && (
                <p className="text-xs text-ink-400">aka {entity.aliases.join(', ')}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => selectEntity(null)}
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-muted hover:text-ink-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="panel p-3">
              <p className="eyebrow mb-1">Risk Score</p>
              <div className="flex items-center gap-2">
                <span className="font-sans text-2xl font-bold text-ink-900">{entity.riskScore}</span>
                <Badge color={riskColor[risk]} variant="solid">{risk.toUpperCase()}</Badge>
              </div>
            </div>
            <div className="panel p-3">
              <p className="eyebrow mb-1">Confidence</p>
              <span className="font-sans text-2xl font-bold text-ink-900">
                {Math.round(entity.confidence * 100)}%
              </span>
            </div>
          </div>

          <button
            onClick={focusOnMap}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-dim"
          >
            Highlight in Network Map <ArrowUpRight className="h-3.5 w-3.5" />
          </button>

          <section>
            <p className="eyebrow mb-2">Attributes</p>
            <dl className="space-y-1.5 text-sm">
              {Object.entries(entity.attributes).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-base-border py-1.5 last:border-0">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="text-right font-medium text-ink-900">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-3 py-1.5 text-xs text-ink-400">
                <dt>Active</dt>
                <dd>{formatDate(entity.firstSeen)} — {formatDate(entity.lastSeen)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <p className="eyebrow mb-2">Relationships ({relationships.length})</p>
            <div className="space-y-1.5">
              {relationships.map((r) => {
                const otherId = r.sourceId === entity.id ? r.targetId : r.sourceId
                const other = activeCaseData.entities.find((e) => e.id === otherId)
                if (!other) return null
                const OtherIcon = entityIcon[other.type]
                return (
                  <button
                    key={r.id}
                    onClick={() => goToEntity(other.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-base-border px-2.5 py-2 text-left transition hover:border-accent/40 hover:bg-base-muted"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${entityColorVar[other.type]}1a`, color: entityColorVar[other.type] }}
                    >
                      <OtherIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-ink-900">{other.label}</span>
                      <span className="block truncate text-[11px] text-ink-400">
                        {r.label} {r.predicted && '· predicted'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <p className="eyebrow mb-2">Recent Activity</p>
            <div className="space-y-3 border-l border-base-border pl-3">
              {events.length === 0 && <p className="text-xs text-ink-400">No timeline activity recorded.</p>}
              {events.map((ev) => (
                <div key={ev.id} className="relative">
                  <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-accent" />
                  <p className="text-xs font-medium text-ink-900">{ev.title}</p>
                  <p className="text-[11px] text-ink-400">{formatDate(ev.timestamp)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
