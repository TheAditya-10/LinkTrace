import { create } from 'zustand'
import type { Case, CaseData, CaseSummary, EvidenceSourceType, ExtractionResult, UserRole } from '@/types'
import { fetchCaseData, fetchCases, createCase as apiCreateCase, type CreateCaseInput } from '@/lib/api'
import type { MergeSummary } from '@/lib/mergeExtraction'
import { generateCaseSummary as fetchCaseSummary } from '@/lib/caseSummaryApi'

interface NetworkFilters {
  entityTypes: Set<string>
  relationshipTypes: Set<string>
  minConfidence: number
  predictedOnly: boolean
}

function defaultFilters(): NetworkFilters {
  return {
    entityTypes: new Set([
      'person',
      'phone',
      'vehicle',
      'location',
      'organization',
      'event',
      'account',
    ]),
    relationshipTypes: new Set([
      'call',
      'transaction',
      'meeting',
      'association',
      'ownership',
      'co-occurrence',
      'movement',
      'family',
      'employment',
    ]),
    minConfidence: 0,
    predictedOnly: false,
  }
}

interface FocusRequest {
  entityId?: string
  relationshipId?: string
  nonce: number
}

interface AppState {
  investigatorName: string | null
  investigatorRole: UserRole | null
  isAuthenticating: boolean
  login: (name: string, role: UserRole) => Promise<void>
  logout: () => void

  cases: Case[]
  casesLoading: boolean
  loadCases: () => Promise<void>
  createCase: (input: CreateCaseInput) => Promise<Case>

  activeCaseData: CaseData | null
  activeCaseLoading: boolean
  loadCase: (caseId: string) => Promise<void>

  filters: NetworkFilters
  setEntityTypeFilter: (types: Set<string>) => void
  setRelationshipTypeFilter: (types: Set<string>) => void
  setMinConfidence: (v: number) => void
  setPredictedOnly: (v: boolean) => void
  resetFilters: () => void

  selectedEntityId: string | null
  selectEntity: (id: string | null) => void

  focusRequest: FocusRequest | null
  requestFocus: (opts: { entityId?: string; relationshipId?: string }) => void
  clearFocusRequest: () => void

  alertsOpen: boolean
  setAlertsOpen: (open: boolean) => void
  markAlertRead: (alertId: string) => void
  readAlertIds: Set<string>

  aiExtractOpen: boolean
  setAiExtractOpen: (open: boolean) => void
  mergeExtraction: (
    result: ExtractionResult,
    source: { sourceType: EvidenceSourceType; rawText?: string; documentId?: string; documentFilename?: string },
  ) => Promise<MergeSummary>

  caseSummary: CaseSummary | null
  caseSummaryLoading: boolean
  caseSummaryError: string | null
  generateCaseSummary: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  investigatorName: null,
  investigatorRole: null,
  isAuthenticating: false,
  login: async (name, role) => {
    set({ isAuthenticating: true })
    await new Promise((r) => setTimeout(r, 900))
    set({ investigatorName: name, investigatorRole: role, isAuthenticating: false })
  },
  logout: () => set({ investigatorName: null, investigatorRole: null }),

  cases: [],
  casesLoading: false,
  loadCases: async () => {
    set({ casesLoading: true })
    const cases = await fetchCases()
    set({ cases, casesLoading: false })
  },
  createCase: async (input) => {
    const created = await apiCreateCase(input)
    set((s) => ({ cases: [created, ...s.cases] }))
    return created
  },

  activeCaseData: null,
  activeCaseLoading: false,
  loadCase: async (caseId: string) => {
    set({
      activeCaseLoading: true,
      selectedEntityId: null,
      filters: defaultFilters(),
      focusRequest: null,
      caseSummary: null,
      caseSummaryLoading: false,
      caseSummaryError: null,
    })
    const data = await fetchCaseData(caseId)
    set({ activeCaseData: data, activeCaseLoading: false })
  },

  filters: defaultFilters(),
  setEntityTypeFilter: (types) => set((s) => ({ filters: { ...s.filters, entityTypes: types } })),
  setRelationshipTypeFilter: (types) =>
    set((s) => ({ filters: { ...s.filters, relationshipTypes: types } })),
  setMinConfidence: (v) => set((s) => ({ filters: { ...s.filters, minConfidence: v } })),
  setPredictedOnly: (v) => set((s) => ({ filters: { ...s.filters, predictedOnly: v } })),
  resetFilters: () => set({ filters: defaultFilters() }),

  selectedEntityId: null,
  selectEntity: (id) => set({ selectedEntityId: id }),

  focusRequest: null,
  requestFocus: (opts) =>
    set({ focusRequest: { ...opts, nonce: (get().focusRequest?.nonce ?? 0) + 1 } }),
  clearFocusRequest: () => set({ focusRequest: null }),

  alertsOpen: false,
  setAlertsOpen: (open) => set({ alertsOpen: open }),
  readAlertIds: new Set(),
  markAlertRead: (alertId) =>
    set((s) => ({ readAlertIds: new Set(s.readAlertIds).add(alertId) })),

  aiExtractOpen: false,
  setAiExtractOpen: (open) => set({ aiExtractOpen: open }),
  mergeExtraction: async (result, source) => {
    const current = get().activeCaseData
    if (!current) return { entitiesAdded: 0, entitiesLinked: 0, relationshipsAdded: 0 }
    const res = await fetch('/api/merge-extraction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: current.case.id, result, ...source }),
    })
    const body = await res.json().catch(() => ({}) as { error?: string })
    if (!res.ok) throw new Error(body.error ?? `Failed to add extraction to case (${res.status})`)
    const { data, summary } = body as { data: CaseData; summary: MergeSummary }
    set({ activeCaseData: data })
    return summary
  },

  caseSummary: null,
  caseSummaryLoading: false,
  caseSummaryError: null,
  generateCaseSummary: async () => {
    const current = get().activeCaseData
    if (!current) return
    set({ caseSummaryLoading: true, caseSummaryError: null })
    try {
      const summary = await fetchCaseSummary(current)
      set({ caseSummary: summary, caseSummaryLoading: false })
    } catch (e) {
      set({
        caseSummaryError: e instanceof Error ? e.message : 'Failed to generate case summary',
        caseSummaryLoading: false,
      })
    }
  },
}))
