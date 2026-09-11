export type EntityType =
  | 'person'
  | 'phone'
  | 'vehicle'
  | 'location'
  | 'organization'
  | 'event'
  | 'account'

export type RelationshipType =
  | 'call'
  | 'transaction'
  | 'meeting'
  | 'association'
  | 'ownership'
  | 'co-occurrence'
  | 'movement'
  | 'family'
  | 'employment'

export type EvidenceSourceType =
  | 'FIR'
  | 'CDR'
  | 'Transaction'
  | 'Surveillance'
  | 'Social Media'
  | 'OCR Scan'
  | 'Vehicle Registry'
  | 'Location Log'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type CaseStatus = 'active' | 'under_review' | 'closed'
export type AlertType = 'new_link' | 'risk_change' | 'contradiction' | 'new_evidence'

export interface Entity {
  id: string
  caseId: string
  type: EntityType
  label: string
  aliases: string[]
  riskScore: number // 0-100
  confidence: number // 0-1
  attributes: Record<string, string>
  evidenceIds: string[]
  firstSeen: string
  lastSeen: string
}

export interface Relationship {
  id: string
  caseId: string
  sourceId: string
  targetId: string
  type: RelationshipType
  label: string
  weight: number // 0-1, drives edge thickness
  occurrenceCount: number
  predicted: boolean
  confidence: number
  evidenceIds: string[]
  firstSeen: string
  lastSeen: string
  description: string
}

export interface Evidence {
  id: string
  caseId: string
  sourceType: EvidenceSourceType
  title: string
  excerpt: string
  timestamp: string
  reliability: 'confirmed' | 'probable' | 'unverified'
  relatedEntityIds: string[]
  relatedRelationshipIds: string[]
  contradictsEvidenceId?: string
  contradictionNote?: string
}

export interface TimelineEvent {
  id: string
  caseId: string
  timestamp: string
  type: RelationshipType | 'alert' | 'evidence_added'
  title: string
  description: string
  entityIds: string[]
  relationshipId?: string
}

export interface Lead {
  id: string
  caseId: string
  entityIds: [string, string]
  relationshipId: string
  priority: Priority
  reason: string
  createdAt: string
}

export interface Alert {
  id: string
  caseId: string
  type: AlertType
  priority: Priority
  title: string
  description: string
  timestamp: string
  read: boolean
  targetEntityId?: string
  targetRelationshipId?: string
}

export interface Case {
  id: string
  name: string
  caseNumber: string
  status: CaseStatus
  riskLevel: RiskLevel
  entityCount: number
  relationshipCount: number
  lastUpdated: string
  openedDate: string
  summary: string
  leadInvestigator: string
  jurisdiction: string
  /** Aggregate counts across the case's alerts/evidence — populated by the cases-list endpoint. */
  openAlertsCount?: number
  criticalAlertsCount?: number
  conflictsCount?: number
  highPriorityLeadsCount?: number
}

export interface CaseData {
  case: Case
  entities: Entity[]
  relationships: Relationship[]
  evidence: Evidence[]
  timeline: TimelineEvent[]
  leads: Lead[]
  alerts: Alert[]
}

/** AI-extraction wire types — shared between the client and the /api/extract-entities function. */
export interface ExtractedEntity {
  tempId: string
  type: EntityType
  label: string
  aliases: string[]
  attributes: { key: string; value: string }[]
  confidence: number
}

export interface ExtractedRelationship {
  sourceTempId: string
  targetTempId: string
  type: RelationshipType
  label: string
  description: string
  confidence: number
}

export interface ExtractionResult {
  entities: ExtractedEntity[]
  relationships: ExtractedRelationship[]
}

/** AI case-briefing wire types — shared between the client and /api/case-summary. */
export interface CaseSummaryPerson {
  entityId: string | null
  role: string
  note: string
}

export interface CaseSummaryMovement {
  date: string
  description: string
}

export interface CaseSummary {
  headline: string
  originEntityId: string | null
  originReason: string
  firSummary: string
  narrative: string[]
  keyPersons: CaseSummaryPerson[]
  majorMovements: CaseSummaryMovement[]
  currentStatus: string
  generatedAt: string
}
