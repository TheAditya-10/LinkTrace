import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Layers, Database, Share2, TriangleAlert, Bell, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { allCaseData } from '@/data'
import { riskColor } from '@/lib/entityMeta'
import type { RiskLevel, CaseStatus } from '@/types'

const statusLabel: Record<CaseStatus, string> = {
  active: 'ACTIVE',
  under_review: 'UNDER REVIEW',
  closed: 'CLOSED',
}

export default function CommandOverviewPage() {
  const navigate = useNavigate()
  const investigatorName = useAppStore((s) => s.investigatorName)
  const loadCase = useAppStore((s) => s.loadCase)
  const createdCases = useAppStore((s) => s.createdCases)

  const allCaseDataWithCreated = useMemo(() => [...allCaseData, ...createdCases], [createdCases])

  const rows = allCaseDataWithCreated.map((d) => {
    const conflicts = d.evidence.filter((e) => e.contradictsEvidenceId).length
    const openAlerts = d.alerts.filter((a) => !a.read).length
    const critAlerts = d.alerts.filter((a) => a.priority === 'critical').length
    return { data: d, conflicts, openAlerts, critAlerts }
  })

  const totals = rows.reduce(
    (acc, r) => ({
      cases: acc.cases + 1,
      entities: acc.entities + r.data.entities.length,
      links: acc.links + r.data.relationships.length,
      conflicts: acc.conflicts + r.conflicts,
      alerts: acc.alerts + r.openAlerts,
    }),
    { cases: 0, entities: 0, links: 0, conflicts: 0, alerts: 0 },
  )

  async function openCase(caseId: string) {
    await loadCase(caseId)
    navigate(`/case/${caseId}/network`)
  }

  return (
    <div className="min-h-screen bg-base-bg">
      <header className="bg-base-navy px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cases')}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-inverse/60 transition hover:bg-white/10 hover:text-ink-inverse"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="font-sans text-sm font-bold uppercase tracking-wide text-ink-inverse">Command Overview</p>
              <p className="mono-tag text-ink-inverse/50">Supervisor · {investigatorName ?? 'GUEST'}</p>
            </div>
          </div>
          <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-violet-300">
            Tier-4 / Command
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="eyebrow mb-2">Portfolio Posture</p>
        <h1 className="mb-8 font-sans text-4xl font-bold tracking-tight text-ink-900">Multi-Case Command Board</h1>

        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <OverviewStat icon={Layers} label="Cases" value={totals.cases} color="#3b82f6" />
          <OverviewStat icon={Database} label="Entities" value={totals.entities} color="#8b5cf6" />
          <OverviewStat icon={Share2} label="Links" value={totals.links} color="#10b981" />
          <OverviewStat icon={TriangleAlert} label="Conflicts" value={totals.conflicts} color="#ef4444" />
          <OverviewStat icon={Bell} label="Open Alerts" value={totals.alerts} color="#f59e0b" />
        </div>

        <p className="eyebrow mb-3">Case Risk Register</p>
        <div className="panel divide-y divide-base-border overflow-hidden">
          {rows.map(({ data, conflicts, openAlerts, critAlerts }) => (
            <button
              key={data.case.id}
              onClick={() => openCase(data.case.id)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-base-muted"
            >
              <span
                className="h-10 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: riskColor[data.case.riskLevel as RiskLevel] }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">{data.case.name}</p>
                <p className="mono-tag">{data.case.caseNumber}</p>
              </div>
              <span
                className="hidden shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-white sm:inline-block"
                style={{ backgroundColor: riskColor[data.case.riskLevel as RiskLevel] }}
              >
                {data.case.riskLevel}
              </span>
              <span className="hidden shrink-0 rounded-full bg-ink-500 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-white sm:inline-block">
                {statusLabel[data.case.status]}
              </span>
              <div className="hidden shrink-0 items-center gap-4 font-mono text-xs md:flex">
                <span className="text-ink-500">{data.entities.length} ent</span>
                <span className={conflicts > 0 ? 'text-risk-critical' : 'text-ink-400'}>{conflicts} conflict</span>
                <span className={openAlerts > 0 ? 'text-risk-medium' : 'text-ink-400'}>{openAlerts} alert</span>
                <span className={critAlerts > 0 ? 'text-risk-critical' : 'text-ink-400'}>{critAlerts} crit</span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

function OverviewStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Layers
  label: string
  value: number
  color: string
}) {
  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <p className="font-sans text-3xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
