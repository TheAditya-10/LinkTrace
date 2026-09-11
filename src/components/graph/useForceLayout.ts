import { useMemo } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceY } from 'd3-force'
import { isOriginEntity } from '@/lib/entityMeta'
import type { Entity, Relationship } from '@/types'

export interface GraphNode extends Entity {
  x: number
  y: number
  radius: number
}

export interface GraphLink {
  relationship: Relationship
  source: GraphNode
  target: GraphNode
}

interface SimNode {
  id: string
  x: number
  y: number
  radius: number
  isOrigin: boolean
}

/**
 * Runs a d3-force simulation to convergence synchronously (no animation loop)
 * and returns final node/link positions. Fine for the case sizes here
 * (a few dozen nodes) — recomputed only when the entity/relationship set
 * or canvas size changes.
 */
export function useForceLayout(
  entities: Entity[],
  relationships: Relationship[],
  degreeById: Map<string, number>,
  width: number,
  height: number,
) {
  return useMemo(() => {
    if (entities.length === 0 || width === 0 || height === 0) {
      return { nodes: [] as GraphNode[], links: [] as GraphLink[] }
    }

    const simNodes: SimNode[] = entities.map((e) => ({
      id: e.id,
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
      radius: 14 + Math.min(degreeById.get(e.id) ?? 0, 10) * 2.2,
      isOrigin: isOriginEntity(e),
    }))
    const nodeById = new Map(simNodes.map((n) => [n.id, n]))

    const simLinks = relationships
      .filter((r) => nodeById.has(r.sourceId) && nodeById.has(r.targetId))
      .map((r) => ({ source: r.sourceId, target: r.targetId, weight: r.weight }))

    const simulation = forceSimulation(simNodes as never[])
      .force(
        'link',
        forceLink(simLinks as never[])
          .id((d: unknown) => (d as SimNode).id)
          .distance((l: unknown) => 90 + (1 - (l as { weight: number }).weight) * 70)
          .strength(0.5),
      )
      .force('charge', forceManyBody().strength(-260))
      .force('center', forceCenter(width / 2, height / 2))
      .force(
        'collide',
        forceCollide((d: unknown) => (d as SimNode).radius + 28),
      )
      // Pulls victims/complainants — wherever the investigation originates — toward
      // a band near the top of the canvas, so they surface visually above the rest
      // of the network instead of settling wherever the force layout happens to land.
      .force(
        'y',
        forceY<SimNode>((d) => (d.isOrigin ? height * 0.15 : height * 0.55)).strength((d) => (d.isOrigin ? 0.35 : 0.02)),
      )
      .stop()

    const iterations = Math.min(400, Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())))
    for (let i = 0; i < iterations; i++) simulation.tick()

    const nodes: GraphNode[] = entities
      .map((e) => {
        const n = nodeById.get(e.id)
        if (!n) return null
        const margin = n.radius + 40
        return {
          ...e,
          x: Math.max(margin, Math.min(width - margin, n.x)),
          y: Math.max(margin, Math.min(height - margin, n.y)),
          radius: n.radius,
        }
      })
      .filter((n): n is GraphNode => n !== null)

    const nodeMapFinal = new Map(nodes.map((n) => [n.id, n]))
    const links: GraphLink[] = relationships
      .map((r) => {
        const source = nodeMapFinal.get(r.sourceId)
        const target = nodeMapFinal.get(r.targetId)
        if (!source || !target) return null
        return { relationship: r, source, target }
      })
      .filter((l): l is GraphLink => l !== null)

    return { nodes, links }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, relationships, width, height])
}
