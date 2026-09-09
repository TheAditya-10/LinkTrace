import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Clock, FolderOpen, TriangleAlert, ChevronRight, ShieldCheck, LogOut, LayoutGrid, Plus } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { SkeletonBlock } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { NewCaseModal } from '@/components/NewCaseModal'
import { riskColor } from '@/lib/entityMeta'
import { formatDate } from '@/lib/utils'
import { allCaseData } from '@/data'
import type { CaseStatus, RiskLevel } from '@/types'

const statusLabel: Record<CaseStatus, string> = {
  active: 'Active',
  under_review: 'Under Review',
  closed: 'Closed',
}

const statusColor: Record<CaseStatus, string> = {
  active: '#06b6d4',
  under_review: '#f59e0b',
  closed: '#64748b',
}

export default function CaseSelectorPage() {
  const navigate = useNavigate()
  const investigatorName = useAppStore((s) => s.investigatorName)
  const logout = useAppStore((s) => s.logout)
  const cases = useAppStore((s) => s.cases)
  const casesLoading = useAppStore((s) => s.casesLoading)
  const loadCases = useAppStore((s) => s.loadCases)
  const loadCase = useAppStore((s) => s.loadCase)
  const createdCases = useAppStore((s) => s.createdCases)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all')
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const [newCaseOpen, setNewCaseOpen] = useState(false)

  useEffect(() => {
    loadCases()
  }, [loadCases])

  const allCaseDataWithCreated = useMemo(() => [...allCaseData, ...createdCases], [createdCases])

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (query.trim() && !c.name.toLowerCase().includes(query.trim().toLowerCase())) return false
      return true
    })
  }, [cases, statusFilter, query])

  const totalEntities = allCaseDataWithCreated.reduce((sum, c) => sum + c.entities.length, 0)
  const openLeads = allCaseDataWithCreated
    .flatMap((c) => c.leads)
    .filter((l) => l.priority === 'high' || l.priority === 'critical').length
  const activeCases = allCaseDataWithCreated.filter((c) => c.case.status === 'active').length

  async function handleSelect(caseId: string) {
    setNavigatingTo(caseId)
    await loadCase(caseId)
    navigate(`/case/${caseId}/network`)
  }

  return (
    <div className="min-h-screen bg-base-bg">
      <header className="sticky top-0 z-10 border-b border-base-border bg-base-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent-bg">
              <ShieldCheck className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="font-sans text-sm font-bold leading-none text-ink-900">LinkTrace</p>
              <p className="mono-tag leading-none">Case Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/command-overview')}
              className="flex items-center gap-1.5 rounded-lg border border-base-border px-2.5 py-1.5 text-xs font-medium text-ink-500 transition hover:border-accent/40 hover:text-accent"
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Command Overview
            </button>
            <span className="hidden text-xs text-ink-500 sm:inline">
              Signed in as <span className="font-medium text-ink-700">{investigatorName}</span>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-base-border px-2.5 py-1.5 text-xs text-ink-500 transition hover:border-risk-critical/40 hover:text-risk-critical"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Avg. network mapping time"
            value="< 2 hrs"
            sub="vs. days–weeks manually"
          />
          <StatCard
            icon={<FolderOpen className="h-4 w-4" />}
            label="Cases active"
            value={String(activeCases)}
            sub={`${totalEntities} entities tracked`}
          />
          <StatCard
            icon={<TriangleAlert className="h-4 w-4" />}
            label="High-priority leads open"
            value={String(openLeads)}
            sub="across all active cases"
          />
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-sans text-lg font-bold text-ink-900">Cases</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cases…"
                className="w-56 rounded-lg border border-base-border bg-base-surface py-1.5 pl-8 pr-3 text-xs text-ink-900 outline-none focus:border-accent/60"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CaseStatus | 'all')}
              className="rounded-lg border border-base-border bg-base-surface px-2.5 py-1.5 text-xs text-ink-700 outline-none focus:border-accent/60"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="under_review">Under Review</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={() => setNewCaseOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-dim"
            >
              <Plus className="h-3.5 w-3.5" /> New Case
            </button>
          </div>
        </div>

        {casesLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-44" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No cases match your filters"
            description="Try clearing the search or status filter."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => {
              const data = allCaseDataWithCreated.find((d) => d.case.id === c.id)!
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  disabled={navigatingTo !== null}
                  className="group relative flex flex-col gap-3 rounded-xl border border-base-border bg-base-surface p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-panel disabled:cursor-wait"
                >
                  {navigatingTo === c.id && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-base-surface/90 backdrop-blur-sm">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                      <p className="mono-tag">Loading case network…</p>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="mono-tag mb-0.5">{c.caseNumber}</p>
                      <h3 className="font-sans text-sm font-semibold text-ink-900">{c.name}</h3>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                  </div>
                  <p className="line-clamp-2 text-xs text-ink-500">{c.summary}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge color={statusColor[c.status]} variant="solid">{statusLabel[c.status]}</Badge>
                    <Badge color={riskColor[c.riskLevel as RiskLevel]}>{c.riskLevel.toUpperCase()} RISK</Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-base-border pt-3 text-[11px] text-ink-400">
                    <span>{data.entities.length} entities · {data.relationships.length} links</span>
                    <span>Updated {formatDate(c.lastUpdated)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      <NewCaseModal
        open={newCaseOpen}
        onClose={() => setNewCaseOpen(false)}
        onCreated={async (caseId) => {
          setNewCaseOpen(false)
          setNavigatingTo(caseId)
          await loadCase(caseId)
          navigate(`/case/${caseId}/network`)
        }}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="panel flex items-start gap-3 p-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-bg text-accent">
        {icon}
      </div>
      <div>
        <p className="eyebrow">{label}</p>
        <p className="font-sans text-xl font-bold text-ink-900">{value}</p>
        <p className="text-[11px] text-ink-400">{sub}</p>
      </div>
    </div>
  )
}
