import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Target, ArrowUpRight, FileSearch } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { entityIcon, entityColorVar, priorityColor } from '@/lib/entityMeta'
import { formatDate } from '@/lib/utils'
import type { Priority } from '@/types'

const priorityOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const priorities: Priority[] = ['critical', 'high', 'medium', 'low']

export default function PriorityLeadsView() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const activeCaseData = useAppStore((s) => s.activeCaseData)
  const requestFocus = useAppStore((s) => s.requestFocus)
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [sort, setSort] = useState<'priority' | 'recency'>('priority')

  const leads = useMemo(() => activeCaseData?.leads ?? [], [activeCaseData])
  const entities = activeCaseData?.entities ?? []

  const filtered = useMemo(() => {
    let list = leads.filter((l) => priorityFilter === 'all' || l.priority === priorityFilter)
    list = [...list].sort((a, b) =>
      sort === 'priority'
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    return list
  }, [leads, priorityFilter, sort])

  if (!activeCaseData) return null

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-sans text-lg font-bold text-ink-900">
            <Target className="h-5 w-5 text-accent" /> Priority Connection Leads
          </h1>
          <p className="text-xs text-ink-500">What to look at first — ranked by investigative priority.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
            className="rounded-lg border border-base-border bg-base-surface px-2.5 py-1.5 text-xs text-ink-700 outline-none focus:border-accent/60"
          >
            <option value="all">All priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'priority' | 'recency')}
            className="rounded-lg border border-base-border bg-base-surface px-2.5 py-1.5 text-xs text-ink-700 outline-none focus:border-accent/60"
          >
            <option value="priority">Sort: Priority</option>
            <option value="recency">Sort: Most recent</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No leads match this filter" description="Try a different priority level." />
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const [e1id, e2id] = lead.entityIds
            const e1 = entities.find((e) => e.id === e1id)
            const e2 = entities.find((e) => e.id === e2id)
            const relationship = activeCaseData.relationships.find((r) => r.id === lead.relationshipId)
            if (!e1 || !e2) return null
            const Icon1 = entityIcon[e1.type]
            const Icon2 = entityIcon[e2.type]
            return (
              <div key={lead.id} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span
                    className="flex h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: priorityColor[lead.priority] }}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <EntityChip icon={Icon1} color={entityColorVar[e1.type]} label={e1.label} />
                      <span className="text-xs text-ink-400">
                        {relationship?.label ?? 'connected via'} {relationship?.predicted && '· predicted'}
                      </span>
                      <EntityChip icon={Icon2} color={entityColorVar[e2.type]} label={e2.label} />
                    </div>
                    <p className="text-xs text-ink-500">
                      <span className="font-medium text-ink-700">Why flagged:</span> {lead.reason}
                    </p>
                    <p className="text-[11px] text-ink-400">Flagged {formatDate(lead.createdAt)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                  <Badge color={priorityColor[lead.priority]} variant="solid">{lead.priority.toUpperCase()}</Badge>
                  <button
                    onClick={() => {
                      requestFocus({ entityId: e1.id })
                      navigate(`/case/${caseId}/network`)
                    }}
                    className="flex items-center gap-1 rounded-lg border border-base-border px-2.5 py-1.5 text-xs font-medium text-ink-700 transition hover:border-accent/40 hover:text-accent"
                  >
                    View in graph <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => navigate(`/case/${caseId}/evidence?relationshipId=${lead.relationshipId}`)}
                    className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-dim"
                  >
                    Evidence <FileSearch className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EntityChip({
  icon: Icon,
  color,
  label,
}: {
  icon: typeof entityIcon.person
  color: string
  label: string
}) {
  return (
    <span
      className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs font-medium"
      style={{ backgroundColor: `${color}14`, color }}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: `${color}26` }}>
        <Icon className="h-3 w-3" />
      </span>
      {label}
    </span>
  )
}
