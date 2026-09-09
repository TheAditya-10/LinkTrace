import type { Case, CaseData, CaseStatus, EvidenceSourceType, ExtractionResult, RiskLevel } from '@/types'
import { mergeExtractionIntoCase } from './mergeExtraction'

function newId(prefix: string): string {
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)
  return `${prefix}-${rand.slice(0, 8)}`
}

export interface NewCaseInput {
  name: string
  caseNumber: string
  jurisdiction: string
  leadInvestigator: string
  riskLevel: RiskLevel
  status: CaseStatus
  crimeSummary: string
  /** Optional: entities/relationships already extracted from an initial document. */
  initialExtraction?: ExtractionResult
  initialSourceText?: string
  initialSourceType?: EvidenceSourceType
  initialSourceLabel?: string
}

/**
 * Builds a brand-new in-memory case, session-only (no backend). If an
 * initial extraction is supplied, it's folded in via the same merge path
 * AI Extraction uses elsewhere, just against an empty case shell.
 */
export function buildNewCaseData(input: NewCaseInput): CaseData {
  const nowIso = new Date().toISOString()
  const id = newId('case')

  const core: Case = {
    id,
    name: input.name.trim(),
    caseNumber: input.caseNumber.trim(),
    status: input.status,
    riskLevel: input.riskLevel,
    entityCount: 0,
    relationshipCount: 0,
    lastUpdated: nowIso,
    openedDate: nowIso,
    summary: input.crimeSummary.length > 140 ? `${input.crimeSummary.slice(0, 140)}…` : input.crimeSummary,
    leadInvestigator: input.leadInvestigator.trim(),
    jurisdiction: input.jurisdiction.trim(),
    crimeSummary: input.crimeSummary.trim(),
    investigationStatus: 'Investigation just opened — no findings yet.',
  }

  let data: CaseData = {
    case: core,
    entities: [],
    relationships: [],
    evidence: [],
    timeline: [
      {
        id: newId('t'),
        caseId: id,
        timestamp: nowIso,
        type: 'evidence_added',
        title: 'Case opened',
        description: `${core.name} opened by ${core.leadInvestigator}.`,
        entityIds: [],
      },
    ],
    leads: [],
    alerts: [],
  }

  if (input.initialExtraction) {
    const { data: merged } = mergeExtractionIntoCase(
      data,
      input.initialExtraction,
      input.initialSourceText ?? '',
      input.initialSourceType ?? 'FIR',
      input.initialSourceLabel ?? 'Initial FIR ingestion',
    )
    data = merged
  }

  data = {
    ...data,
    case: { ...data.case, entityCount: data.entities.length, relationshipCount: data.relationships.length },
  }

  return data
}
