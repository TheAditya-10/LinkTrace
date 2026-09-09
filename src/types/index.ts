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

/** An entity's role in the case narrative. Unset means "not yet determined". */
export type EntityRole = 'accused' | 'victim' | 'witness' | 'suspect'

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
  role?: EntityRole
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
  /** Fuller narrative of what happened — the crime itself. */
  crimeSummary: string
  /** Where the investigation currently stands. */
  investigationStatus: string
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
  role?: EntityRole
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
  /** One or two sentences summarizing the incident, when the source reads like an FIR. */
  caseSummary: string
}
