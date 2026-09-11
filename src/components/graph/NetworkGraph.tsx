import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Siren } from 'lucide-react'
import type { GraphLink, GraphNode } from './useForceLayout'
import { entityIcon, entityColorVar, isOriginEntity, ORIGIN_COLOR } from '@/lib/entityMeta'
import { cn } from '@/lib/utils'

interface Transform {
  x: number
  y: number
  k: number
}

interface NetworkGraphProps {
  nodes: GraphNode[]
  links: GraphLink[]
  width: number
  height: number
  selectedEntityId: string | null
  focusedEntityId: string | null
  onNodeClick: (id: string) => void
  onLinkClick: (linkId: string, screenPos: { x: number; y: number }) => void
  fitNonce: number
}

const MIN_K = 0.25
const MAX_K = 2.5

export function NetworkGraph({
  nodes,
  links,
  width,
  height,
  selectedEntityId,
  focusedEntityId,
  onNodeClick,
  onLinkClick,
  fitNonce,
}: NetworkGraphProps) {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 })
  // True only for the brief moment a programmatic re-fit is animating the camera —
  // never during a drag or wheel-zoom, which must track the pointer instantly.
  const [isFitting, setIsFitting] = useState(false)
  const fitTimeoutRef = useRef<number>()
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const gridId = useId()

  const fitToScreen = useCallback(() => {
    window.clearTimeout(fitTimeoutRef.current)
    setIsFitting(true)
    fitTimeoutRef.current = window.setTimeout(() => setIsFitting(false), 500)

    if (nodes.length === 0 || width === 0 || height === 0) {
      setTransform({ x: 0, y: 0, k: 1 })
      return
    }
    const xs = nodes.map((n) => n.x)
    const ys = nodes.map((n) => n.y)
    const minX = Math.min(...xs) - 60
    const maxX = Math.max(...xs) + 60
    const minY = Math.min(...ys) - 60
    const maxY = Math.max(...ys) + 60
    const boundsW = Math.max(maxX - minX, 1)
    const boundsH = Math.max(maxY - minY, 1)
    const k = Math.min(MAX_K, Math.max(MIN_K, Math.min(width / boundsW, height / boundsH)))
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    setTransform({ x: width / 2 - cx * k, y: height / 2 - cy * k, k })
  }, [nodes, width, height])

  useEffect(() => {
    fitToScreen()
  }, [fitToScreen, fitNonce])

  useEffect(() => () => window.clearTimeout(fitTimeoutRef.current), [])

  const focusSet = useMemo(() => {
    if (!focusedEntityId) return null
    const neighborIds = new Set<string>([focusedEntityId])
    for (const l of links) {
      if (l.relationship.sourceId === focusedEntityId) neighborIds.add(l.relationship.targetId)
      if (l.relationship.targetId === focusedEntityId) neighborIds.add(l.relationship.sourceId)
    }
    return neighborIds
  }, [focusedEntityId, links])

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    setIsFitting(false)
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform((t) => {
      const newK = Math.min(MAX_K, Math.max(MIN_K, t.k * delta))
      const wx = (mx - t.x) / t.k
      const wy = (my - t.y) / t.k
      return { k: newK, x: mx - wx * newK, y: my - wy * newK }
    })
  }

  function handlePointerDown(e: React.PointerEvent) {
    if ((e.target as SVGElement).dataset.nodeId || (e.target as SVGElement).closest?.('[data-node-id]')) return
    setIsFitting(false)
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: transform.x, origY: transform.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragState.current
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    setTransform((t) => ({ ...t, x: drag.origX + dx, y: drag.origY + dy }))
  }
  function handlePointerUp() {
    dragState.current = null
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <defs>
        <pattern id={gridId} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#E2E8F3" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill={`url(#${gridId})`} />
      <g
        className={cn(isFitting && 'transition-transform duration-500 ease-out')}
        transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}
      >
        {links.map((l) => {
          const dimmed = focusSet ? !(focusSet.has(l.relationship.sourceId) && focusSet.has(l.relationship.targetId)) : false
          const isSelected = selectedEntityId
            ? l.relationship.sourceId === selectedEntityId || l.relationship.targetId === selectedEntityId
            : false
          const midX = (l.source.x + l.target.x) / 2
          const midY = (l.source.y + l.target.y) / 2
          const linkGeometryTransition = 'x1 300ms ease-out, y1 300ms ease-out, x2 300ms ease-out, y2 300ms ease-out'
          return (
            <g key={l.relationship.id} opacity={dimmed ? 0.12 : 1} className="transition-opacity duration-300">
              <line
                x1={l.source.x}
                y1={l.source.y}
                x2={l.target.x}
                y2={l.target.y}
                stroke={isSelected ? '#06b6d4' : l.relationship.predicted ? '#c4b5fd' : '#93c5fd'}
                strokeWidth={Math.max(1.2, l.relationship.weight * 3.2)}
                strokeDasharray={l.relationship.predicted ? '5 4' : undefined}
                className="cursor-pointer"
                style={{ transition: linkGeometryTransition }}
                onClick={(e) => {
                  e.stopPropagation()
                  const rect = svgRef.current?.getBoundingClientRect()
                  onLinkClick(l.relationship.id, {
                    x: (rect?.left ?? 0) + transform.x + midX * transform.k,
                    y: (rect?.top ?? 0) + transform.y + midY * transform.k,
                  })
                }}
              />
              <line
                x1={l.source.x}
                y1={l.source.y}
                x2={l.target.x}
                y2={l.target.y}
                stroke="transparent"
                strokeWidth={14}
                className="cursor-pointer"
                style={{ transition: linkGeometryTransition }}
                onClick={(e) => {
                  e.stopPropagation()
                  const rect = svgRef.current?.getBoundingClientRect()
                  onLinkClick(l.relationship.id, {
                    x: (rect?.left ?? 0) + transform.x + midX * transform.k,
                    y: (rect?.top ?? 0) + transform.y + midY * transform.k,
                  })
                }}
              />
            </g>
          )
        })}
        {nodes.map((n) => {
          const Icon = entityIcon[n.type]
          const color = entityColorVar[n.type]
          const dimmed = focusSet ? !focusSet.has(n.id) : false
          const isSelected = n.id === selectedEntityId
          const isOrigin = isOriginEntity(n)
          return (
            <g
              key={n.id}
              data-node-id={n.id}
              transform={`translate(${n.x} ${n.y})`}
              opacity={dimmed ? 0.25 : 1}
              className="cursor-pointer transition-[opacity,transform] duration-300 ease-out"
              onClick={(e) => {
                e.stopPropagation()
                onNodeClick(n.id)
              }}
            >
              {isOrigin && (
                <circle
                  r={n.radius + 10}
                  fill="none"
                  stroke={ORIGIN_COLOR}
                  strokeWidth={2}
                  strokeDasharray="3 4"
                />
              )}
              {isSelected && <circle r={n.radius + 6} fill="none" stroke="#06b6d4" strokeWidth={2} />}
              <circle r={n.radius} fill={color} fillOpacity={0.16} stroke={color} strokeWidth={2} />
              <foreignObject x={-9} y={-9} width={18} height={18} className="pointer-events-none">
                <Icon width={18} height={18} color={color} strokeWidth={2.2} />
              </foreignObject>
              {isOrigin && (
                <g transform={`translate(${n.radius * 0.62} ${-n.radius * 0.62})`} className="pointer-events-none">
                  <circle r={8} fill="#FFFFFF" stroke={ORIGIN_COLOR} strokeWidth={1.5} />
                  <foreignObject x={-6} y={-6} width={12} height={12}>
                    <Siren width={12} height={12} color={ORIGIN_COLOR} strokeWidth={2.5} />
                  </foreignObject>
                </g>
              )}
              <g transform={`translate(0 ${n.radius + 8})`}>
                <text
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  style={{ font: '600 11px Inter, sans-serif', fill: '#0B1220' }}
                  y={11}
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {n.label.length > 22 ? `${n.label.slice(0, 21)}…` : n.label}
                </text>
              </g>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
