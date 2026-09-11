// Server-only case persistence. Row <-> wire-type mapping mirrors src/types/index.ts
// closely; imported by /api files via relative paths.
import { randomUUID } from 'node:crypto'
import { sql } from './db.js'
import type { Alert, Case, CaseData, Entity, Evidence, Lead, Relationship, TimelineEvent } from '../types/index.js'

interface CaseRow {
  id: string
  name: string
  case_number: string
  status: string
  risk_level: string
  opened_date: string
  last_updated: string
  summary: string
  lead_investigator: string
  jurisdiction: string
  entity_count?: string | number
  relationship_count?: string | number
  open_alerts_count?: string | number
  critical_alerts_count?: string | number
  conflicts_count?: string | number
  high_priority_leads_count?: string | number
}

function caseFromRow(r: CaseRow): Case {
  return {
    id: r.id,
    name: r.name,
    caseNumber: r.case_number,
    status: r.status as Case['status'],
    riskLevel: r.risk_level as Case['riskLevel'],
    entityCount: Number(r.entity_count ?? 0),
    relationshipCount: Number(r.relationship_count ?? 0),
    lastUpdated: new Date(r.last_updated).toISOString(),
    openedDate: new Date(r.opened_date).toISOString(),
    summary: r.summary,
    leadInvestigator: r.lead_investigator,
    jurisdiction: r.jurisdiction,
    openAlertsCount: Number(r.open_alerts_count ?? 0),
    criticalAlertsCount: Number(r.critical_alerts_count ?? 0),
    conflictsCount: Number(r.conflicts_count ?? 0),
    highPriorityLeadsCount: Number(r.high_priority_leads_count ?? 0),
  }
}

export async function listCases(): Promise<Case[]> {
  const rows = (await sql()`
    select
      c.*,
      coalesce(ec.cnt, 0) as entity_count,
      coalesce(rc.cnt, 0) as relationship_count,
      coalesce(ac.open_count, 0) as open_alerts_count,
      coalesce(ac.critical_count, 0) as critical_alerts_count,
      coalesce(evc.conflict_count, 0) as conflicts_count,
      coalesce(lc.high_priority_count, 0) as high_priority_leads_count
    from cases c
    left join (select case_id, count(*) as cnt from entities group by case_id) ec on ec.case_id = c.id
    left join (select case_id, count(*) as cnt from relationships group by case_id) rc on rc.case_id = c.id
    left join (
      select case_id,
        count(*) filter (where not read) as open_count,
        count(*) filter (where priority = 'critical') as critical_count
      from alerts group by case_id
    ) ac on ac.case_id = c.id
    left join (
      select case_id, count(*) as conflict_count from evidence where contradicts_evidence_id is not null group by case_id
    ) evc on evc.case_id = c.id
    left join (
      select case_id, count(*) as high_priority_count from leads where priority in ('high', 'critical') group by case_id
    ) lc on lc.case_id = c.id
    order by c.last_updated desc
  `) as unknown as CaseRow[]
  return rows.map(caseFromRow)
}

export interface CreateCaseInput {
  name: string
  caseNumber: string
  jurisdiction: string
  leadInvestigator: string
  summary: string
}

export async function createCase(input: CreateCaseInput): Promise<Case> {
  const id = `case-${randomUUID().slice(0, 8)}`
  const now = new Date().toISOString()
  const rows = (await sql()`
    insert into cases (id, name, case_number, status, risk_level, opened_date, last_updated, summary, lead_investigator, jurisdiction)
    values (${id}, ${input.name}, ${input.caseNumber}, 'active', 'medium', ${now}, ${now}, ${input.summary}, ${input.leadInvestigator}, ${input.jurisdiction})
    returning *
  `) as unknown as CaseRow[]
  return caseFromRow({
    ...rows[0],
    entity_count: 0,
    relationship_count: 0,
    open_alerts_count: 0,
    critical_alerts_count: 0,
    conflicts_count: 0,
    high_priority_leads_count: 0,
  })
}

function entityFromRow(r: Record<string, unknown>): Entity {
  return {
    id: r.id as string,
    caseId: r.case_id as string,
    type: r.type as Entity['type'],
    label: r.label as string,
    aliases: (r.aliases as string[]) ?? [],
    riskScore: Number(r.risk_score),
    confidence: Number(r.confidence),
    attributes: (r.attributes as Record<string, string>) ?? {},
    evidenceIds: (r.evidence_ids as string[]) ?? [],
    firstSeen: new Date(r.first_seen as string).toISOString(),
    lastSeen: new Date(r.last_seen as string).toISOString(),
  }
}

function relationshipFromRow(r: Record<string, unknown>): Relationship {
  return {
    id: r.id as string,
    caseId: r.case_id as string,
    sourceId: r.source_id as string,
    targetId: r.target_id as string,
    type: r.type as Relationship['type'],
    label: r.label as string,
    weight: Number(r.weight),
    occurrenceCount: Number(r.occurrence_count),
    predicted: Boolean(r.predicted),
    confidence: Number(r.confidence),
    evidenceIds: (r.evidence_ids as string[]) ?? [],
    firstSeen: new Date(r.first_seen as string).toISOString(),
    lastSeen: new Date(r.last_seen as string).toISOString(),
    description: r.description as string,
  }
}

function evidenceFromRow(r: Record<string, unknown>): Evidence {
  return {
    id: r.id as string,
    caseId: r.case_id as string,
    sourceType: r.source_type as Evidence['sourceType'],
    title: r.title as string,
    excerpt: r.excerpt as string,
    timestamp: new Date(r.timestamp as string).toISOString(),
    reliability: r.reliability as Evidence['reliability'],
    relatedEntityIds: (r.related_entity_ids as string[]) ?? [],
    relatedRelationshipIds: (r.related_relationship_ids as string[]) ?? [],
    contradictsEvidenceId: (r.contradicts_evidence_id as string | null) ?? undefined,
    contradictionNote: (r.contradiction_note as string | null) ?? undefined,
  }
}

function timelineFromRow(r: Record<string, unknown>): TimelineEvent {
  return {
    id: r.id as string,
    caseId: r.case_id as string,
    timestamp: new Date(r.timestamp as string).toISOString(),
    type: r.type as TimelineEvent['type'],
    title: r.title as string,
    description: r.description as string,
    entityIds: (r.entity_ids as string[]) ?? [],
    relationshipId: (r.relationship_id as string | null) ?? undefined,
  }
}

function leadFromRow(r: Record<string, unknown>): Lead {
  return {
    id: r.id as string,
    caseId: r.case_id as string,
    entityIds: (r.entity_ids as [string, string]),
    relationshipId: r.relationship_id as string,
    priority: r.priority as Lead['priority'],
    reason: r.reason as string,
    createdAt: new Date(r.created_at as string).toISOString(),
  }
}

function alertFromRow(r: Record<string, unknown>): Alert {
  return {
    id: r.id as string,
    caseId: r.case_id as string,
    type: r.type as Alert['type'],
    priority: r.priority as Alert['priority'],
    title: r.title as string,
    description: r.description as string,
    timestamp: new Date(r.timestamp as string).toISOString(),
    read: Boolean(r.read),
    targetEntityId: (r.target_entity_id as string | null) ?? undefined,
    targetRelationshipId: (r.target_relationship_id as string | null) ?? undefined,
  }
}

export async function getCaseData(caseId: string): Promise<CaseData | null> {
  const client = sql()
  const [caseRows, entityRows, relationshipRows, evidenceRows, timelineRows, leadRows, alertRows] = await Promise.all([
    client`select * from cases where id = ${caseId}` as unknown as Promise<CaseRow[]>,
    client`select * from entities where case_id = ${caseId} order by first_seen` as unknown as Promise<Record<string, unknown>[]>,
    client`select * from relationships where case_id = ${caseId} order by first_seen` as unknown as Promise<Record<string, unknown>[]>,
    client`select * from evidence where case_id = ${caseId} order by timestamp` as unknown as Promise<Record<string, unknown>[]>,
    client`select * from timeline_events where case_id = ${caseId} order by timestamp` as unknown as Promise<Record<string, unknown>[]>,
    client`select * from leads where case_id = ${caseId} order by created_at` as unknown as Promise<Record<string, unknown>[]>,
    client`select * from alerts where case_id = ${caseId} order by timestamp` as unknown as Promise<Record<string, unknown>[]>,
  ])

  if (caseRows.length === 0) return null

  const entities = entityRows.map(entityFromRow)
  const relationships = relationshipRows.map(relationshipFromRow)

  return {
    case: caseFromRow({ ...caseRows[0], entity_count: entities.length, relationship_count: relationships.length }),
    entities,
    relationships,
    evidence: evidenceRows.map(evidenceFromRow),
    timeline: timelineRows.map(timelineFromRow),
    leads: leadRows.map(leadFromRow),
    alerts: alertRows.map(alertFromRow),
  }
}

/**
 * Persists the diff between a CaseData snapshot taken before running
 * mergeExtractionIntoCase and the CaseData it returned: inserts genuinely new
 * entities/relationships/evidence, and updates evidence_ids on existing
 * entities that gained a reference to the new evidence record.
 */
export async function applyMergeToDb(caseId: string, before: CaseData, after: CaseData): Promise<void> {
  const client = sql()
  const beforeEntityIds = new Set(before.entities.map((e) => e.id))
  const beforeRelationshipIds = new Set(before.relationships.map((r) => r.id))
  const beforeEvidenceIds = new Set(before.evidence.map((ev) => ev.id))
  const beforeById = new Map(before.entities.map((e) => [e.id, e]))

  const newEntities = after.entities.filter((e) => !beforeEntityIds.has(e.id))
  const updatedEntities = after.entities.filter((e) => {
    const prior = beforeById.get(e.id)
    return prior && prior.evidenceIds.length !== e.evidenceIds.length
  })
  const newRelationships = after.relationships.filter((r) => !beforeRelationshipIds.has(r.id))
  const newEvidence = after.evidence.filter((ev) => !beforeEvidenceIds.has(ev.id))

  for (const e of newEntities) {
    await client`
      insert into entities (id, case_id, type, label, aliases, risk_score, confidence, attributes, evidence_ids, first_seen, last_seen)
      values (${e.id}, ${caseId}, ${e.type}, ${e.label}, ${e.aliases}, ${e.riskScore}, ${e.confidence}, ${JSON.stringify(e.attributes)}, ${e.evidenceIds}, ${e.firstSeen}, ${e.lastSeen})
    `
  }
  for (const e of updatedEntities) {
    await client`update entities set evidence_ids = ${e.evidenceIds}, last_seen = ${e.lastSeen} where id = ${e.id}`
  }
  for (const r of newRelationships) {
    await client`
      insert into relationships (id, case_id, source_id, target_id, type, label, weight, occurrence_count, predicted, confidence, description, evidence_ids, first_seen, last_seen)
      values (${r.id}, ${caseId}, ${r.sourceId}, ${r.targetId}, ${r.type}, ${r.label}, ${r.weight}, ${r.occurrenceCount}, ${r.predicted}, ${r.confidence}, ${r.description}, ${r.evidenceIds}, ${r.firstSeen}, ${r.lastSeen})
    `
  }
  for (const ev of newEvidence) {
    await client`
      insert into evidence (id, case_id, source_type, title, excerpt, timestamp, reliability, related_entity_ids, related_relationship_ids)
      values (${ev.id}, ${caseId}, ${ev.sourceType}, ${ev.title}, ${ev.excerpt}, ${ev.timestamp}, ${ev.reliability}, ${ev.relatedEntityIds}, ${ev.relatedRelationshipIds})
    `
  }
  await client`update cases set last_updated = now() where id = ${caseId}`
}
