import { useCallback, useEffect, useMemo, useRef } from 'react'
import ForceGraph2D, { type ForceGraphMethods, type ForceGraphProps, type GraphData } from 'react-force-graph-2d'
import { forceCollide, forceLink, forceManyBody, forceY } from 'd3-force'
import { entityColorVar, isOriginEntity, ORIGIN_COLOR } from '@/lib/entityMeta'
import type { Entity, Relationship } from '@/types'

interface GraphNode extends Entity {
  radius: number
  isOrigin: boolean
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface GraphLink extends Relationship {
  source: string | GraphNode
  target: string | GraphNode
}

interface NetworkGraphProps {
  entities: Entity[]
  relationships: Relationship[]
  degreeById: Map<string, number>
  width: number
  height: number
  selectedEntityId: string | null
  focusedEntityId: string | null
  onNodeClick: (id: string) => void
  onLinkClick: (linkId: string, screenPos: { x: number; y: number }) => void
  fitNonce: number
}

const MIN_ZOOM = 0.25
const MAX_ZOOM = 2.5
const FIT_PADDING = 60
const LABEL_FONT = '600 11px Inter, sans-serif'

function nodeRadius(degree: number) {
  return 14 + Math.min(degree, 10) * 2.2
}

function nodeLabel(label: string) {
  return label.length > 22 ? `${label.slice(0, 21)}…` : label
}

function collisionRadius(node: GraphNode) {
  // The label sits below the node; reserving its half-width keeps neighbouring labels readable.
  return Math.max(node.radius + 16, nodeLabel(node.label).length * 3.4 + 14)
}

function isGraphNode(value: GraphLink['source'] | GraphLink['target']): value is GraphNode {
  return typeof value === 'object' && value !== null
}

function drawEntityGlyph(node: GraphNode, ctx: CanvasRenderingContext2D) {
  const color = entityColorVar[node.type]
  const size = Math.min(9, node.radius * 0.48)

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  switch (node.type) {
    case 'person':
      ctx.beginPath()
      ctx.arc(0, -size * 0.38, size * 0.3, 0, Math.PI * 2)
      ctx.moveTo(-size * 0.58, size * 0.72)
      ctx.arc(0, size * 0.72, size * 0.58, Math.PI, 0)
      ctx.stroke()
      break
    case 'phone':
      ctx.beginPath()
      ctx.moveTo(-size * 0.48, -size * 0.62)
      ctx.lineTo(-size * 0.14, -size * 0.28)
      ctx.lineTo(-size * 0.4, size * 0.12)
      ctx.lineTo(size * 0.2, size * 0.7)
      ctx.lineTo(size * 0.6, size * 0.4)
      ctx.stroke()
      break
    case 'vehicle':
      ctx.strokeRect(-size * 0.78, -size * 0.24, size * 1.56, size * 0.75)
      ctx.beginPath()
      ctx.arc(-size * 0.48, size * 0.58, size * 0.18, 0, Math.PI * 2)
      ctx.arc(size * 0.48, size * 0.58, size * 0.18, 0, Math.PI * 2)
      ctx.stroke()
      break
    case 'location':
      ctx.beginPath()
      ctx.arc(0, -size * 0.22, size * 0.52, 0, Math.PI * 2)
      ctx.moveTo(-size * 0.35, size * 0.12)
      ctx.lineTo(0, size * 0.82)
      ctx.lineTo(size * 0.35, size * 0.12)
      ctx.stroke()
      break
    case 'organization':
      ctx.strokeRect(-size * 0.58, -size * 0.72, size * 1.16, size * 1.44)
      ctx.beginPath()
      ctx.moveTo(-size * 0.22, -size * 0.32)
      ctx.lineTo(size * 0.22, -size * 0.32)
      ctx.moveTo(-size * 0.22, size * 0.12)
      ctx.lineTo(size * 0.22, size * 0.12)
      ctx.moveTo(0, size * 0.72)
      ctx.lineTo(0, size * 0.38)
      ctx.stroke()
      break
    case 'event':
      ctx.strokeRect(-size * 0.64, -size * 0.58, size * 1.28, size * 1.22)
      ctx.beginPath()
      ctx.moveTo(-size * 0.64, -size * 0.16)
      ctx.lineTo(size * 0.64, -size * 0.16)
      ctx.moveTo(-size * 0.34, -size * 0.82)
      ctx.lineTo(-size * 0.34, -size * 0.38)
      ctx.moveTo(size * 0.34, -size * 0.82)
      ctx.lineTo(size * 0.34, -size * 0.38)
      ctx.stroke()
      break
    case 'account':
      ctx.strokeRect(-size * 0.76, -size * 0.44, size * 1.52, size * 0.96)
      ctx.beginPath()
      ctx.arc(size * 0.3, size * 0.04, size * 0.08, 0, Math.PI * 2)
      ctx.fill()
      break
  }

  ctx.restore()
}

function drawSiren(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = ORIGIN_COLOR
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(0, 0, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 1, 3.1, Math.PI, 0)
  ctx.moveTo(-4, 4.2)
  ctx.lineTo(4, 4.2)
  ctx.moveTo(-4.4, -2.2)
  ctx.lineTo(-6, -3.8)
  ctx.moveTo(4.4, -2.2)
  ctx.lineTo(6, -3.8)
  ctx.stroke()
  ctx.restore()
}

export function NetworkGraph({
  entities,
  relationships,
  degreeById,
  width,
  height,
  selectedEntityId,
  focusedEntityId,
  onNodeClick,
  onLinkClick,
  fitNonce,
}: NetworkGraphProps) {
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>()

  const graphData = useMemo<GraphData<GraphNode, GraphLink>>(() => {
    const nodes = entities.map((entity) => ({
      ...entity,
      radius: nodeRadius(degreeById.get(entity.id) ?? 0),
      isOrigin: isOriginEntity(entity),
    }))
    const nodeIds = new Set(nodes.map((node) => node.id))
    const links = relationships
      .filter((relationship) => nodeIds.has(relationship.sourceId) && nodeIds.has(relationship.targetId))
      .map((relationship) => ({
        ...relationship,
        source: relationship.sourceId,
        target: relationship.targetId,
      }))

    return { nodes, links }
  }, [degreeById, entities, relationships])

  const focusSet = useMemo(() => {
    if (!focusedEntityId) return null
    const neighborIds = new Set<string>([focusedEntityId])
    for (const relationship of relationships) {
      if (relationship.sourceId === focusedEntityId) neighborIds.add(relationship.targetId)
      if (relationship.targetId === focusedEntityId) neighborIds.add(relationship.sourceId)
    }
    return neighborIds
  }, [focusedEntityId, relationships])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph) return

    graph.d3Force(
      'link',
      forceLink<GraphNode, GraphLink>(graphData.links)
        .id((node) => node.id)
        .distance((link) => 90 + (1 - link.weight) * 70)
        .strength(0.5),
    )
    graph.d3Force('charge', forceManyBody<GraphNode>().strength(-260))
    graph.d3Force('collide', forceCollide<GraphNode>(collisionRadius).strength(1).iterations(2))
    // Investigation origins remain in a visually distinct upper band without rigidly pinning them.
    graph.d3Force(
      'origin-y',
      forceY<GraphNode>((node) => (node.isOrigin ? -140 : 40)).strength((node) => (node.isOrigin ? 0.35 : 0.02)),
    )
    graph.d3ReheatSimulation()
  }, [graphData])

  const fitToScreen = useCallback(() => {
    const graph = graphRef.current
    if (!graph) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    graph.zoomToFit(reduceMotion ? 0 : 500, FIT_PADDING)
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(fitToScreen)
    return () => window.cancelAnimationFrame(frame)
  }, [fitNonce, fitToScreen, graphData])

  const drawLink = useCallback<NonNullable<ForceGraphProps<GraphNode, GraphLink>['linkCanvasObject']>>(
    (link, ctx) => {
      if (!isGraphNode(link.source) || !isGraphNode(link.target)) return
      const dimmed = focusSet ? !(focusSet.has(link.sourceId) && focusSet.has(link.targetId)) : false
      const selected = selectedEntityId === link.sourceId || selectedEntityId === link.targetId

      ctx.save()
      ctx.globalAlpha = dimmed ? 0.12 : 1
      ctx.beginPath()
      ctx.moveTo(link.source.x ?? 0, link.source.y ?? 0)
      ctx.lineTo(link.target.x ?? 0, link.target.y ?? 0)
      ctx.strokeStyle = selected ? '#06b6d4' : link.predicted ? '#c4b5fd' : '#93c5fd'
      ctx.lineWidth = Math.max(1.2, link.weight * 3.2)
      ctx.setLineDash(link.predicted ? [5, 4] : [])
      ctx.stroke()
      ctx.restore()
    },
    [focusSet, selectedEntityId],
  )

  const paintLinkPointerArea = useCallback<NonNullable<ForceGraphProps<GraphNode, GraphLink>['linkPointerAreaPaint']>>(
    (link, paintColor, ctx, globalScale) => {
      if (!isGraphNode(link.source) || !isGraphNode(link.target)) return
      ctx.beginPath()
      ctx.moveTo(link.source.x ?? 0, link.source.y ?? 0)
      ctx.lineTo(link.target.x ?? 0, link.target.y ?? 0)
      ctx.strokeStyle = paintColor
      ctx.lineWidth = 14 / globalScale
      ctx.stroke()
    },
    [],
  )

  const drawNode = useCallback<NonNullable<ForceGraphProps<GraphNode, GraphLink>['nodeCanvasObject']>>(
    (node, ctx) => {
      const x = node.x ?? 0
      const y = node.y ?? 0
      const color = entityColorVar[node.type]
      const dimmed = focusSet ? !focusSet.has(node.id) : false
      const selected = node.id === selectedEntityId

      ctx.save()
      ctx.globalAlpha = dimmed ? 0.25 : 1

      if (node.isOrigin) {
        ctx.beginPath()
        ctx.arc(x, y, node.radius + 10, 0, Math.PI * 2)
        ctx.strokeStyle = ORIGIN_COLOR
        ctx.lineWidth = 2
        ctx.setLineDash([3, 4])
        ctx.stroke()
        ctx.setLineDash([])
      }

      if (selected) {
        ctx.beginPath()
        ctx.arc(x, y, node.radius + 6, 0, Math.PI * 2)
        ctx.strokeStyle = '#06b6d4'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.arc(x, y, node.radius, 0, Math.PI * 2)
      ctx.fillStyle = `${color}29`
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.translate(x, y)
      drawEntityGlyph(node, ctx)
      ctx.restore()

      if (node.isOrigin) drawSiren(ctx, x + node.radius * 0.62, y - node.radius * 0.62)

      ctx.font = LABEL_FONT
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.lineWidth = 3
      ctx.strokeStyle = '#FFFFFF'
      ctx.strokeText(nodeLabel(node.label), x, y + node.radius + 8)
      ctx.fillStyle = '#0B1220'
      ctx.fillText(nodeLabel(node.label), x, y + node.radius + 8)
      ctx.restore()
    },
    [focusSet, selectedEntityId],
  )

  const paintNodePointerArea = useCallback<NonNullable<ForceGraphProps<GraphNode, GraphLink>['nodePointerAreaPaint']>>(
    (node, paintColor, ctx) => {
      ctx.beginPath()
      ctx.arc(node.x ?? 0, node.y ?? 0, node.radius + 6, 0, Math.PI * 2)
      ctx.fillStyle = paintColor
      ctx.fill()
    },
    [],
  )

  return (
    <div
      className="cursor-grab active:cursor-grabbing"
      style={{
        width,
        height,
        backgroundImage:
          'linear-gradient(#E2E8F3 1px, transparent 1px), linear-gradient(90deg, #E2E8F3 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <ForceGraph2D<GraphNode, GraphLink>
        ref={graphRef}
        graphData={graphData}
        width={width}
        height={height}
        backgroundColor="rgba(255,255,255,0)"
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        nodeCanvasObjectMode={() => 'replace'}
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={paintNodePointerArea}
        linkCanvasObjectMode={() => 'replace'}
        linkCanvasObject={drawLink}
        linkPointerAreaPaint={paintLinkPointerArea}
        linkHoverPrecision={7}
        enableNodeDrag={false}
        showPointerCursor={(object) => object !== undefined}
        onNodeClick={(node) => onNodeClick(node.id)}
        onLinkClick={(link, event) => onLinkClick(link.id, { x: event.clientX, y: event.clientY })}
      />
    </div>
  )
}
