import type { Entity, Relationship } from '@/types'

export interface EntityMetrics {
  id: string
  degree: number
  isBridge: boolean
  clusterId: number
}

/**
 * Degree = number of distinct neighbors. Bridges = articulation points,
 * found via Tarjan's low-link DFS. An articulation point's removal would
 * split its cluster into multiple components — i.e. it structurally
 * connects otherwise separate sub-clusters. Case graphs here are small
 * (tens of nodes), so plain recursion is safe.
 */
export function computeEntityMetrics(
  entities: Entity[],
  relationships: Relationship[],
): Map<string, EntityMetrics> {
  const adjacency = new Map<string, Set<string>>()
  for (const e of entities) adjacency.set(e.id, new Set())
  for (const r of relationships) {
    adjacency.get(r.sourceId)?.add(r.targetId)
    adjacency.get(r.targetId)?.add(r.sourceId)
  }

  const degree = new Map<string, number>()
  for (const [id, neighbors] of adjacency) degree.set(id, neighbors.size)

  // Connected components (clusters)
  const clusterId = new Map<string, number>()
  let currentCluster = 0
  for (const e of entities) {
    if (clusterId.has(e.id)) continue
    const stack = [e.id]
    clusterId.set(e.id, currentCluster)
    while (stack.length) {
      const node = stack.pop()!
      for (const next of adjacency.get(node) ?? []) {
        if (!clusterId.has(next)) {
          clusterId.set(next, currentCluster)
          stack.push(next)
        }
      }
    }
    currentCluster += 1
  }

  // Articulation points via recursive Tarjan low-link
  const bridges = new Set<string>()
  const visited = new Set<string>()
  const disc = new Map<string, number>()
  const low = new Map<string, number>()
  let timer = 0

  function dfs(node: string, parent: string | null) {
    visited.add(node)
    disc.set(node, timer)
    low.set(node, timer)
    timer += 1
    let childCount = 0

    for (const neighbor of adjacency.get(node) ?? []) {
      if (neighbor === parent) continue
      if (visited.has(neighbor)) {
        low.set(node, Math.min(low.get(node)!, disc.get(neighbor)!))
      } else {
        childCount += 1
        dfs(neighbor, node)
        low.set(node, Math.min(low.get(node)!, low.get(neighbor)!))
        const isRoot = parent === null
        if (isRoot && childCount > 1) bridges.add(node)
        if (!isRoot && low.get(neighbor)! >= disc.get(node)!) bridges.add(node)
      }
    }
  }

  for (const e of entities) {
    if (!visited.has(e.id)) dfs(e.id, null)
  }

  const result = new Map<string, EntityMetrics>()
  for (const e of entities) {
    result.set(e.id, {
      id: e.id,
      degree: degree.get(e.id) ?? 0,
      isBridge: bridges.has(e.id),
      clusterId: clusterId.get(e.id) ?? -1,
    })
  }
  return result
}

/**
 * For a bridge (articulation point) entity, find which sub-groups its
 * removal would split its neighborhood into — i.e. what it actually
 * bridges. Returns representative entity ids from up to two of the
 * resulting sub-groups.
 */
export function describeBridgeGroups(
  entityId: string,
  entities: Entity[],
  relationships: Relationship[],
): [string, string] | null {
  const adjacency = new Map<string, Set<string>>()
  for (const e of entities) adjacency.set(e.id, new Set())
  for (const r of relationships) {
    if (r.sourceId === entityId || r.targetId === entityId) continue
    adjacency.get(r.sourceId)?.add(r.targetId)
    adjacency.get(r.targetId)?.add(r.sourceId)
  }

  const neighbors = new Set<string>()
  for (const r of relationships) {
    if (r.sourceId === entityId) neighbors.add(r.targetId)
    if (r.targetId === entityId) neighbors.add(r.sourceId)
  }

  const groupOf = new Map<string, number>()
  let groupCount = 0
  for (const start of neighbors) {
    if (groupOf.has(start)) continue
    const stack = [start]
    groupOf.set(start, groupCount)
    while (stack.length) {
      const node = stack.pop()!
      for (const next of adjacency.get(node) ?? []) {
        if (next !== entityId && !groupOf.has(next)) {
          groupOf.set(next, groupCount)
          stack.push(next)
        }
      }
    }
    groupCount += 1
  }

  if (groupCount < 2) return null
  const repByGroup = new Map<number, string>()
  for (const [id, g] of groupOf) {
    if (!repByGroup.has(g)) repByGroup.set(g, id)
  }
  const reps = [...repByGroup.values()]
  if (reps.length < 2) return null
  return [reps[0], reps[1]]
}
