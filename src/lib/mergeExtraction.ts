import type { CaseData, Entity, Evidence, EvidenceSourceType, ExtractionResult } from '@/types'

function newId(prefix: string): string {
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)
  return `${prefix}-${rand.slice(0, 8)}`
}

function findExistingEntity(entities: Entity[], label: string): Entity | undefined {
  const q = label.trim().toLowerCase()
  return entities.find(
    (e) => e.label.trim().toLowerCase() === q || e.aliases.some((a) => a.trim().toLowerCase() === q),
  )
}

export interface MergeSummary {
  entitiesAdded: number
  entitiesLinked: number
  relationshipsAdded: number
}

/**
 * Folds an AI extraction result into a case's data, purely client-side
 * (no persistence — this only lives in the session's Zustand store).
 * Entities whose label/alias matches an existing entity are reused rather
 * than duplicated; everything else is created fresh and tied to one new
 * Evidence record built from the pasted source text.
 */
export function mergeExtractionIntoCase(
  caseData: CaseData,
  result: ExtractionResult,
  rawText: string,
  sourceType: EvidenceSourceType,
): { data: CaseData; summary: MergeSummary } {
  const nowIso = new Date().toISOString()
  // Deep-ish clone: caseData.entities are shared fixture objects (module-level
  // singletons), so mutating evidenceIds below must not touch the originals.
  const entities = caseData.entities.map((e) => ({ ...e, aliases: [...e.aliases], attributes: { ...e.attributes }, evidenceIds: [...e.evidenceIds] }))
  const tempIdToRealId = new Map<string, string>()
  let entitiesAdded = 0
  let entitiesLinked = 0

  for (const e of result.entities) {
    const existing = findExistingEntity(entities, e.label)
    if (existing) {
      tempIdToRealId.set(e.tempId, existing.id)
      entitiesLinked += 1
      continue
    }
    const id = newId('ai-ent')
    tempIdToRealId.set(e.tempId, id)
    entities.push({
      id,
      caseId: caseData.case.id,
      type: e.type,
      label: e.label,
      aliases: e.aliases,
      riskScore: Math.round(e.confidence * 60), // conservative until an analyst reviews it
      confidence: e.confidence,
      attributes: Object.fromEntries(e.attributes.map((a) => [a.key, a.value])),
      evidenceIds: [],
      firstSeen: nowIso,
      lastSeen: nowIso,
    })
    entitiesAdded += 1
  }

  const relationships = [...caseData.relationships]
  const newRelationshipIds: string[] = []
  for (const r of result.relationships) {
    const sourceId = tempIdToRealId.get(r.sourceTempId)
    const targetId = tempIdToRealId.get(r.targetTempId)
    if (!sourceId || !targetId || sourceId === targetId) continue
    const id = newId('ai-rel')
    relationships.push({
      id,
      caseId: caseData.case.id,
      sourceId,
      targetId,
      type: r.type,
      label: r.label,
      weight: r.confidence,
      occurrenceCount: 1,
      predicted: false,
      confidence: r.confidence,
      evidenceIds: [],
      firstSeen: nowIso,
      lastSeen: nowIso,
      description: r.description,
    })
    newRelationshipIds.push(id)
  }

  const touchedEntityIds = [...new Set([...tempIdToRealId.values()])]
  let evidence = caseData.evidence
  if (touchedEntityIds.length > 0 || newRelationshipIds.length > 0) {
    const evidenceId = newId('ai-ev')
    const newEvidence: Evidence = {
      id: evidenceId,
      caseId: caseData.case.id,
      sourceType,
      title: `AI-extracted from pasted ${sourceType} text`,
      excerpt: rawText.length > 320 ? `${rawText.slice(0, 320)}…` : rawText,
      timestamp: nowIso,
      reliability: 'probable',
      relatedEntityIds: touchedEntityIds,
      relatedRelationshipIds: newRelationshipIds,
    }
    evidence = [...caseData.evidence, newEvidence]

    for (const e of entities) {
      if (touchedEntityIds.includes(e.id) && !e.evidenceIds.includes(evidenceId)) e.evidenceIds.push(evidenceId)
    }
    for (const r of relationships) {
      if (newRelationshipIds.includes(r.id)) r.evidenceIds.push(evidenceId)
    }
  }

  return {
    data: { ...caseData, entities, relationships, evidence },
    summary: { entitiesAdded, entitiesLinked, relationshipsAdded: newRelationshipIds.length },
  }
}
