import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GitBranch, Award, ArrowUpRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { computeEntityMetrics, describeBridgeGroups } from '@/lib/analytics'
import { entityIcon, entityColorVar, riskLevelFromScore, riskColor, roleColor, roleLabel } from '@/lib/entityMeta'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

export default function KeyEntitiesView() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const activeCaseData = useAppStore((s) => s.activeCaseData)
  const selectEntity = useAppStore((s) => s.selectEntity)
  const requestFocus = useAppStore((s) => s.requestFocus)

  const entities = useMemo(() => activeCaseData?.entities ?? [], [activeCaseData])
  const relationships = useMemo(() => activeCaseData?.relationships ?? [], [activeCaseData])

  const metrics = useMemo(() => computeEntityMetrics(entities, relationships), [entities, relationships])

  const keyEntities = useMemo(
    () =>
      [...entities]
        .filter((e) => (metrics.get(e.id)?.degree ?? 0) > 0)
        .sort((a, b) => (metrics.get(b.id)?.degree ?? 0) - (metrics.get(a.id)?.degree ?? 0))
        .slice(0, 8),
    [entities, metrics],
  )

  const bridgeEntities = useMemo(() => entities.filter((e) => metrics.get(e.id)?.isBridge), [entities, metrics])

  const clusters = useMemo(() => {
    const map = new Map<number, typeof entities>()
    for (const e of entities) {
      const c = metrics.get(e.id)?.clusterId ?? -1
      if (!map.has(c)) map.set(c, [])
      map.get(c)!.push(e)
    }
    return [...map.entries()]
      .filter(([, members]) => members.length > 1)
      .sort((a, b) => b[1].length - a[1].length)
  }, [entities, metrics])

  function highlight(entityId: string) {
    requestFocus({ entityId })
    navigate(`/case/${caseId}/network`)
  }

  if (!activeCaseData) return null
  if (entities.length === 0) return <EmptyState title="No entities in this case" />

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-sans text-lg font-bold text-ink-900">
          <GitBranch className="h-5 w-5 text-accent" /> Key &amp; Bridge Entities
        </h1>
        <p className="text-xs text-ink-500">Who matters most in this network, computed from connection structure.</p>
      </div>

      <section className="mb-8">
        <p className="eyebrow mb-3">Key Entities — ranked by connections</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {keyEntities.map((e, i) => {
            const Icon = entityIcon[e.type]
            const risk = riskLevelFromScore(e.riskScore)
            const m = metrics.get(e.id)!
            return (
              <button
                key={e.id}
                onClick={() => selectEntity(e.id)}
                className="panel flex flex-col gap-2 p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/40"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${entityColorVar[e.type]}1a`, color: entityColorVar[e.type] }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {i < 3 && <Award className="h-4 w-4 text-amber-400" />}
                </div>
                <p className="truncate text-sm font-semibold text-ink-900">{e.label}</p>
                <div className="flex items-center gap-1.5">
                  <Badge color={riskColor[risk]}>{risk}</Badge>
                  {m.isBridge && <Badge color="#8b5cf6">bridge</Badge>}
                  {e.role && <Badge color={roleColor[e.role]} variant="solid">{roleLabel[e.role]}</Badge>}
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-base-border pt-2 text-[11px] text-ink-500">
                  <span>{m.degree} connections</span>
                  <span
                    role="button"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      highlight(e.id)
                    }}
                    className="flex items-center gap-0.5 text-accent hover:underline"
                  >
                    Map <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mb-8">
        <p className="eyebrow mb-3">Bridge Entities — connect otherwise separate clusters</p>
        {bridgeEntities.length === 0 ? (
          <EmptyState title="No bridge entities detected" description="This case's network doesn't have a single point connecting separate clusters." />
        ) : (
          <div className="space-y-2">
            {bridgeEntities.map((e) => {
              const Icon = entityIcon[e.type]
              const groups = describeBridgeGroups(e.id, entities, relationships)
              const g1 = groups ? entities.find((x) => x.id === groups[0]) : null
              const g2 = groups ? entities.find((x) => x.id === groups[1]) : null
              return (
                <div key={e.id} className="panel flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${entityColorVar[e.type]}1a`, color: entityColorVar[e.type] }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{e.label}</p>
                      {g1 && g2 ? (
                        <p className="text-xs text-ink-500">
                          Bridges the cluster around <span className="font-medium text-ink-700">{g1.label}</span> ↔{' '}
                          <span className="font-medium text-ink-700">{g2.label}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-ink-500">Structurally critical connector for this cluster</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => highlight(e.id)}
                    className="flex shrink-0 items-center gap-1 self-start rounded-lg border border-base-border px-2.5 py-1.5 text-xs font-medium text-ink-700 transition hover:border-accent/40 hover:text-accent sm:self-center"
                  >
                    Highlight in map <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <p className="eyebrow mb-3">Clusters</p>
        <div className="flex flex-wrap gap-3">
          {clusters.map(([clusterId, members]) => (
            <div key={clusterId} className="panel min-w-[220px] flex-1 p-3.5">
              <p className="mb-2 text-xs font-semibold text-ink-700">Cluster {clusterId + 1} · {members.length} entities</p>
              <div className="flex flex-wrap gap-1.5">
                {members.map((m) => {
                  const Icon = entityIcon[m.type]
                  return (
                    <span
                      key={m.id}
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                      style={{ backgroundColor: `${entityColorVar[m.type]}14`, color: entityColorVar[m.type] }}
                    >
                      <Icon className="h-3 w-3" /> {m.label}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
