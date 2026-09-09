import { useState } from 'react'
import { SlidersHorizontal, ChevronDown, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { entityLabel, entityColorVar } from '@/lib/entityMeta'
import { cn } from '@/lib/utils'
import type { EntityType, RelationshipType } from '@/types'

const entityTypes: EntityType[] = ['person', 'phone', 'vehicle', 'location', 'organization', 'event', 'account']
const relationshipTypes: RelationshipType[] = [
  'call',
  'transaction',
  'meeting',
  'association',
  'ownership',
  'co-occurrence',
  'movement',
  'family',
  'employment',
]

export function GraphControls() {
  const [open, setOpen] = useState(true)
  const filters = useAppStore((s) => s.filters)
  const setEntityTypeFilter = useAppStore((s) => s.setEntityTypeFilter)
  const setRelationshipTypeFilter = useAppStore((s) => s.setRelationshipTypeFilter)
  const setMinConfidence = useAppStore((s) => s.setMinConfidence)
  const setPredictedOnly = useAppStore((s) => s.setPredictedOnly)
  const resetFilters = useAppStore((s) => s.resetFilters)

  function toggleEntityType(t: EntityType) {
    const next = new Set(filters.entityTypes)
    if (next.has(t)) next.delete(t)
    else next.add(t)
    setEntityTypeFilter(next)
  }
  function toggleRelType(t: RelationshipType) {
    const next = new Set(filters.relationshipTypes)
    if (next.has(t)) next.delete(t)
    else next.add(t)
    setRelationshipTypeFilter(next)
  }

  return (
    <div className="w-72 shrink-0 overflow-y-auto border-r border-base-border bg-base-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold text-ink-900"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-accent" /> Graph Controls
        </span>
        <ChevronDown className={cn('h-4 w-4 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="space-y-5 border-t border-base-border px-4 py-4">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="eyebrow">Entity Filter</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {entityTypes.map((t) => {
                const active = filters.entityTypes.has(t)
                const color = entityColorVar[t]
                return (
                  <button
                    key={t}
                    onClick={() => toggleEntityType(t)}
                    className="rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide transition"
                    style={
                      active
                        ? { color, backgroundColor: `${color}1a`, border: `1px solid ${color}55` }
                        : { color: '#94a3b8', backgroundColor: '#F5F7FC', border: '1px solid #E2E8F3' }
                    }
                  >
                    {entityLabel[t]}
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <p className="eyebrow mb-2">Relationship Filter</p>
            <div className="flex flex-wrap gap-1.5">
              {relationshipTypes.map((t) => {
                const active = filters.relationshipTypes.has(t)
                return (
                  <button
                    key={t}
                    onClick={() => toggleRelType(t)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide transition',
                      active
                        ? 'border-accent/40 bg-accent-bg text-accent'
                        : 'border-base-border bg-base-muted text-ink-400',
                    )}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="eyebrow">Min Confidence</p>
              <span className="font-mono text-[11px] text-ink-500">{Math.round(filters.minConfidence * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={filters.minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </section>

          <section className="flex items-center justify-between">
            <p className="eyebrow">Predicted Links Only</p>
            <button
              onClick={() => setPredictedOnly(!filters.predictedOnly)}
              className={cn(
                'relative h-5 w-9 rounded-full transition',
                filters.predictedOnly ? 'bg-accent' : 'bg-base-border-strong',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                  filters.predictedOnly ? 'translate-x-4' : 'translate-x-0.5',
                )}
              />
            </button>
          </section>

          <button
            onClick={resetFilters}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-base-border py-2 text-xs font-medium text-ink-500 transition hover:border-accent/40 hover:text-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset filters
          </button>
        </div>
      )}
    </div>
  )
}
