import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, Play, Pause, ArrowUpRight, Phone, Banknote, Users, Link2, Car, MapPin, Home, FileStack, Bell } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { EmptyState } from '@/components/ui/EmptyState'
import { entityColorVar } from '@/lib/entityMeta'
import { formatDateTime } from '@/lib/utils'

const eventIcon: Record<string, typeof Phone> = {
  call: Phone,
  transaction: Banknote,
  meeting: Users,
  association: Link2,
  ownership: Home,
  'co-occurrence': Link2,
  movement: Car,
  family: Users,
  employment: Users,
  alert: Bell,
  evidence_added: FileStack,
}

export default function TimelineView() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const activeCaseData = useAppStore((s) => s.activeCaseData)
  const selectEntity = useAppStore((s) => s.selectEntity)

  const events = useMemo(
    () => [...(activeCaseData?.timeline ?? [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [activeCaseData],
  )
  const entities = activeCaseData?.entities ?? []

  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [scrubPct, setScrubPct] = useState(100)
  const [playing, setPlaying] = useState(false)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const minTime = events[0] ? new Date(events[0].timestamp).getTime() : 0
  const maxTime = events[events.length - 1] ? new Date(events[events.length - 1].timestamp).getTime() : 0
  const cutoff = minTime + ((maxTime - minTime) * scrubPct) / 100

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setScrubPct((p) => {
        if (p >= 100) {
          setPlaying(false)
          return 100
        }
        return Math.min(100, p + 1.5)
      })
    }, 90)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [playing])

  const visibleEvents = useMemo(() => {
    return events.filter((e) => {
      if (new Date(e.timestamp).getTime() > cutoff) return false
      if (entityFilter !== 'all' && !e.entityIds.includes(entityFilter)) return false
      return true
    })
  }, [events, cutoff, entityFilter])

  if (!activeCaseData) return null
  if (events.length === 0) return <EmptyState title="No timeline activity recorded for this case" />

  const activeEvent = activeEventId ? events.find((e) => e.id === activeEventId) : null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-base-border px-6 py-5">
        <h1 className="flex items-center gap-2 font-sans text-lg font-bold text-ink-900">
          <Clock className="h-5 w-5 text-accent" /> Temporal Activity
        </h1>
        <p className="mb-4 text-xs text-ink-500">Scrub through the case timeline to see how the network's activity evolved.</p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (scrubPct >= 100) setScrubPct(0)
              setPlaying((p) => !p)
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-dim"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-0.5" />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={scrubPct}
            onChange={(e) => {
              setPlaying(false)
              setScrubPct(Number(e.target.value))
            }}
            className="w-full accent-accent"
          />
          <span className="mono-tag w-32 shrink-0 text-right">{formatDateTime(new Date(cutoff).toISOString())}</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-lg border border-base-border bg-base-surface px-2.5 py-1.5 text-xs text-ink-700 outline-none focus:border-accent/60"
          >
            <option value="all">All entities</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-ink-400">
            {visibleEvents.length} of {events.length} events shown
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {visibleEvents.length === 0 ? (
            <EmptyState title="No activity in this window" description="Move the scrubber forward or clear the entity filter." />
          ) : (
            <div className="relative space-y-4 border-l border-base-border pl-5">
              {[...visibleEvents].reverse().map((ev) => {
                const Icon = eventIcon[ev.type] ?? MapPin
                return (
                  <button
                    key={ev.id}
                    onClick={() => setActiveEventId(ev.id)}
                    className={`relative block w-full rounded-lg border p-3 text-left transition ${
                      activeEventId === ev.id ? 'border-accent/50 bg-accent-bg' : 'border-base-border bg-base-surface hover:border-accent/30'
                    }`}
                  >
                    <span className="absolute -left-[27px] top-4 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink-900">{ev.title}</p>
                      <span className="mono-tag">{formatDateTime(ev.timestamp)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">{ev.description}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {ev.entityIds.map((id) => {
                        const ent = entities.find((e) => e.id === id)
                        if (!ent) return null
                        return (
                          <span
                            key={id}
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: `${entityColorVar[ent.type]}14`, color: entityColorVar[ent.type] }}
                          >
                            {ent.label}
                          </span>
                        )
                      })}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {activeEvent && (
          <div className="w-72 shrink-0 overflow-y-auto border-l border-base-border bg-base-surface p-4">
            <p className="eyebrow mb-2">Selected Event</p>
            <p className="mb-1 text-sm font-semibold text-ink-900">{activeEvent.title}</p>
            <p className="mb-3 text-xs text-ink-500">{activeEvent.description}</p>
            <p className="mono-tag mb-4">{formatDateTime(activeEvent.timestamp)}</p>
            <div className="space-y-2">
              {activeEvent.entityIds.slice(0, 1).map((id) => (
                <button
                  key={id}
                  onClick={() => selectEntity(id)}
                  className="w-full rounded-lg border border-base-border px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-accent/40 hover:text-accent"
                >
                  View entity details
                </button>
              ))}
              {activeEvent.relationshipId && (
                <button
                  onClick={() => navigate(`/case/${caseId}/evidence?relationshipId=${activeEvent.relationshipId}`)}
                  className="flex w-full items-center justify-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-dim"
                >
                  View full evidence <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
