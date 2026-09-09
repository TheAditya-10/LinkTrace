import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Maximize2, ArrowUpRight, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useMeasure } from '@/lib/useMeasure'
import { computeEntityMetrics } from '@/lib/analytics'
import { useForceLayout } from '@/components/graph/useForceLayout'
import { NetworkGraph } from '@/components/graph/NetworkGraph'
import { GraphControls } from '@/components/graph/GraphControls'
import { EmptyState } from '@/components/ui/EmptyState'
import { Waypoints } from 'lucide-react'

export default function NetworkMapView() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const activeCaseData = useAppStore((s) => s.activeCaseData)
  const filters = useAppStore((s) => s.filters)
  const resetFilters = useAppStore((s) => s.resetFilters)
  const selectedEntityId = useAppStore((s) => s.selectedEntityId)
  const selectEntity = useAppStore((s) => s.selectEntity)
  const focusRequest = useAppStore((s) => s.focusRequest)
  const clearFocusRequest = useAppStore((s) => s.clearFocusRequest)

  const { ref, width, height } = useMeasure<HTMLDivElement>()
  const [fitNonce, setFitNonce] = useState(0)
  const [popover, setPopover] = useState<{ linkId: string; x: number; y: number } | null>(null)

  useEffect(() => {
    if (focusRequest?.entityId) {
      selectEntity(focusRequest.entityId)
      clearFocusRequest()
    }
  }, [focusRequest, selectEntity, clearFocusRequest])

  const entities = useMemo(() => activeCaseData?.entities ?? [], [activeCaseData])
  const relationships = useMemo(() => activeCaseData?.relationships ?? [], [activeCaseData])

  const filteredEntities = useMemo(
    () => entities.filter((e) => filters.entityTypes.has(e.type)),
    [entities, filters.entityTypes],
  )
  const entityIdSet = useMemo(() => new Set(filteredEntities.map((e) => e.id)), [filteredEntities])

  const filteredRelationships = useMemo(
    () =>
      relationships.filter(
        (r) =>
          entityIdSet.has(r.sourceId) &&
          entityIdSet.has(r.targetId) &&
          filters.relationshipTypes.has(r.type) &&
          r.confidence >= filters.minConfidence &&
          (!filters.predictedOnly || r.predicted),
      ),
    [relationships, entityIdSet, filters],
  )

  const visibleEntities = useMemo(() => {
    const touched = new Set<string>()
    for (const r of filteredRelationships) {
      touched.add(r.sourceId)
      touched.add(r.targetId)
    }
    return filteredEntities.filter((e) => touched.has(e.id) || relationships.every((r) => r.sourceId !== e.id && r.targetId !== e.id))
  }, [filteredEntities, filteredRelationships, relationships])

  const metrics = useMemo(
    () => computeEntityMetrics(visibleEntities, filteredRelationships),
    [visibleEntities, filteredRelationships],
  )
  const degreeById = useMemo(() => {
    const m = new Map<string, number>()
    for (const [id, v] of metrics) m.set(id, v.degree)
    return m
  }, [metrics])

  const { nodes, links } = useForceLayout(visibleEntities, filteredRelationships, degreeById, width, height)

  const clusterCount = useMemo(() => new Set([...metrics.values()].map((m) => m.clusterId)).size, [metrics])

  const popoverLink = popover ? links.find((l) => l.relationship.id === popover.linkId) : null

  function goToEvidence(relationshipId: string) {
    navigate(`/case/${caseId}/evidence?relationshipId=${relationshipId}`)
  }

  const isEmpty = !activeCaseData ? false : nodes.length === 0

  return (
    <div className="flex h-full">
      <GraphControls />
      <div ref={ref} className="relative min-w-0 flex-1 bg-base-bg">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center p-8">
            <EmptyState
              icon={<Waypoints className="h-8 w-8" />}
              title="No entities match the current filters"
              description="Try widening the entity/relationship filters, lowering the confidence threshold, or resetting filters."
              action={
                <button
                  onClick={resetFilters}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dim"
                >
                  Reset filters
                </button>
              }
            />
          </div>
        ) : (
          <NetworkGraph
            nodes={nodes}
            links={links}
            width={width}
            height={height}
            selectedEntityId={selectedEntityId}
            focusedEntityId={selectedEntityId}
            onNodeClick={(id) => {
              selectEntity(id)
              setPopover(null)
            }}
            onLinkClick={(linkId, screenPos) => setPopover({ linkId, ...screenPos })}
            fitNonce={fitNonce}
          />
        )}

        {/* Legend */}
        <div className="panel absolute right-4 top-4 space-y-1.5 px-3 py-2.5">
          <p className="eyebrow mb-1">Legend</p>
          <div className="flex items-center gap-2 text-[11px] text-ink-500">
            <span className="h-0.5 w-5 bg-[#93c5fd]" /> Observed
          </div>
          <div className="flex items-center gap-2 text-[11px] text-ink-500">
            <span
              className="h-0.5 w-5"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg,#c4b5fd 0 4px,transparent 4px 7px)' }}
            />
            Predicted
          </div>
        </div>

        {/* Stats + fit button */}
        {!isEmpty && (
          <>
            <div className="panel absolute bottom-4 left-4 px-3 py-1.5 font-mono text-[11px] text-ink-500">
              {nodes.length} NODE{nodes.length === 1 ? '' : 'S'} &nbsp;|&nbsp; {links.length} EDGE{links.length === 1 ? '' : 'S'} &nbsp;|&nbsp; {clusterCount} CLUSTER{clusterCount === 1 ? '' : 'S'}
            </div>
            <button
              onClick={() => setFitNonce((n) => n + 1)}
              className="panel absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-accent/40 hover:text-accent"
            >
              <Maximize2 className="h-3.5 w-3.5" /> Fit
            </button>
          </>
        )}

        {/* Edge popover */}
        {popoverLink && (
          <>
            <button className="fixed inset-0 z-30" onClick={() => setPopover(null)} aria-label="dismiss" />
            <div
              className="panel absolute z-40 w-64 space-y-2 p-3.5"
              style={{
                left: Math.min(Math.max(popover!.x - (ref.current?.getBoundingClientRect().left ?? 0), 8), width - 264),
                top: Math.min(Math.max(popover!.y - (ref.current?.getBoundingClientRect().top ?? 0), 8), height - 160),
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="mono-tag mb-0.5">{popoverLink.relationship.type}{popoverLink.relationship.predicted && ' · predicted'}</p>
                  <p className="text-sm font-semibold text-ink-900">{popoverLink.relationship.label}</p>
                </div>
                <button onClick={() => setPopover(null)} className="text-ink-400 hover:text-ink-900">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-ink-500">{popoverLink.relationship.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-ink-500">
                <span>Weight {Math.round(popoverLink.relationship.weight * 100)}%</span>
                <span>{popoverLink.relationship.occurrenceCount} occurrences</span>
                <span>{Math.round(popoverLink.relationship.confidence * 100)}% confidence</span>
              </div>
              <button
                onClick={() => goToEvidence(popoverLink.relationship.id)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dim"
              >
                View evidence <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
