import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileSearch, Search, TriangleAlert, ArrowUpRight, FileText, Phone, Banknote, Camera, Share2, ScanLine, Car, MapPinned } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { entityIcon, entityColorVar } from '@/lib/entityMeta'
import { formatDateTime } from '@/lib/utils'
import type { EvidenceSourceType } from '@/types'

const sourceIcon: Record<EvidenceSourceType, typeof FileText> = {
  FIR: FileText,
  CDR: Phone,
  Transaction: Banknote,
  Surveillance: Camera,
  'Social Media': Share2,
  'OCR Scan': ScanLine,
  'Vehicle Registry': Car,
  'Location Log': MapPinned,
}

const reliabilityColor: Record<string, string> = {
  confirmed: '#10b981',
  probable: '#f59e0b',
  unverified: '#94a3b8',
}

export default function EvidenceTraceView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCaseData = useAppStore((s) => s.activeCaseData)
  const [query, setQuery] = useState('')

  const relationshipId = searchParams.get('relationshipId')
  const relationships = useMemo(() => activeCaseData?.relationships ?? [], [activeCaseData])
  const entities = useMemo(() => activeCaseData?.entities ?? [], [activeCaseData])
  const evidence = activeCaseData?.evidence ?? []

  const selected = relationships.find((r) => r.id === relationshipId) ?? null

  const searchResults = useMemo(() => {
    if (!query.trim()) return relationships.slice(0, 20)
    const q = query.toLowerCase()
    return relationships.filter((r) => {
      const e1 = entities.find((e) => e.id === r.sourceId)
      const e2 = entities.find((e) => e.id === r.targetId)
      return (
        r.label.toLowerCase().includes(q) ||
        e1?.label.toLowerCase().includes(q) ||
        e2?.label.toLowerCase().includes(q)
      )
    })
  }, [query, relationships, entities])

  if (!activeCaseData) return null

  function selectRelationship(id: string) {
    setSearchParams({ relationshipId: id })
  }

  const e1 = selected ? entities.find((e) => e.id === selected.sourceId) : null
  const e2 = selected ? entities.find((e) => e.id === selected.targetId) : null
  const evidenceChain = selected
    ? evidence.filter((ev) => selected.evidenceIds.includes(ev.id)).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : []

  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0 overflow-y-auto border-r border-base-border bg-base-surface">
        <div className="border-b border-base-border p-4">
          <p className="eyebrow mb-2">Browse Relationships</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by entity or relation…"
              className="w-full rounded-lg border border-base-border bg-base-muted py-1.5 pl-8 pr-3 text-xs text-ink-900 outline-none focus:border-accent/50"
            />
          </div>
        </div>
        <div className="divide-y divide-base-border">
          {searchResults.map((r) => {
            const s = entities.find((e) => e.id === r.sourceId)
            const t = entities.find((e) => e.id === r.targetId)
            const hasContradiction = evidence.some((ev) => r.evidenceIds.includes(ev.id) && ev.contradictsEvidenceId)
            return (
              <button
                key={r.id}
                onClick={() => selectRelationship(r.id)}
                className={`block w-full px-4 py-3 text-left text-xs transition hover:bg-base-muted ${
                  selected?.id === r.id ? 'bg-accent-bg' : ''
                }`}
              >
                <p className="truncate font-medium text-ink-900">
                  {s?.label} ↔ {t?.label}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-ink-400">
                  {r.label}
                  {r.predicted && <Badge color="#8b5cf6">predicted</Badge>}
                  {hasContradiction && <Badge color="#ef4444">contradiction</Badge>}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex h-full items-center justify-center p-8">
            <EmptyState
              icon={<FileSearch className="h-8 w-8" />}
              title="Select a relationship to trace"
              description="Pick one from the list, or arrive here via a link from the Network Map, Priority Leads, or Temporal Activity view."
            />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-6 py-6">
            <div className="panel mb-6 p-5">
              <p className="eyebrow mb-3">Explaining this connection</p>
              <div className="flex flex-wrap items-center gap-3">
                {[e1, e2].map((e, i) => {
                  if (!e) return null
                  const Icon = entityIcon[e.type]
                  return (
                    <span key={e.id} className="flex items-center gap-3">
                      <span
                        className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-sm font-medium"
                        style={{ backgroundColor: `${entityColorVar[e.type]}14`, color: entityColorVar[e.type] }}
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: `${entityColorVar[e.type]}26` }}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        {e.label}
                      </span>
                      {i === 0 && <ArrowUpRight className="h-4 w-4 rotate-45 text-ink-300" />}
                    </span>
                  )
                })}
              </div>
              <p className="mt-3 text-sm text-ink-700">{selected.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge color="#06b6d4">{selected.type}</Badge>
                {selected.predicted && <Badge color="#8b5cf6">predicted / inferred</Badge>}
                <Badge color="#64748b">weight {Math.round(selected.weight * 100)}%</Badge>
                <Badge color="#64748b">{selected.occurrenceCount} occurrences</Badge>
                <Badge color="#64748b">{Math.round(selected.confidence * 100)}% confidence</Badge>
              </div>
            </div>

            <p className="eyebrow mb-3">Evidence Chain ({evidenceChain.length})</p>
            <div className="space-y-3">
              {evidenceChain.length === 0 ? (
                <EmptyState title="No evidence records linked" />
              ) : (
                evidenceChain.map((ev) => {
                  const Icon = sourceIcon[ev.sourceType]
                  const contradictedBy = ev.contradictsEvidenceId
                    ? evidence.find((x) => x.id === ev.contradictsEvidenceId)
                    : null
                  return (
                    <div key={ev.id}>
                      {contradictedBy && (
                        <div className="mb-2 flex items-start gap-2 rounded-lg border border-risk-critical/40 bg-risk-critical/5 p-3">
                          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-risk-critical" />
                          <div>
                            <p className="text-xs font-semibold text-risk-critical">Contradiction flagged</p>
                            <p className="text-xs text-ink-700">
                              {ev.contradictionNote ?? 'This record conflicts with another piece of evidence in the chain.'}
                            </p>
                            <p className="mt-1 text-[11px] text-ink-500">Conflicts with: "{contradictedBy.title}"</p>
                          </div>
                        </div>
                      )}
                      <div className="panel flex gap-3 p-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-bg text-accent">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-ink-900">{ev.title}</p>
                            <span className="mono-tag">{formatDateTime(ev.timestamp)}</span>
                          </div>
                          <p className="mt-1 text-xs text-ink-500">{ev.excerpt}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge color="#64748b">{ev.sourceType}</Badge>
                            <Badge color={reliabilityColor[ev.reliability]}>{ev.reliability}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
