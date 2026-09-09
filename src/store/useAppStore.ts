import { create } from 'zustand'
import type { Case, CaseData, EvidenceSourceType, ExtractionResult } from '@/types'
import { fetchCaseData, fetchCases } from '@/lib/api'
import { mergeExtractionIntoCase, type MergeSummary } from '@/lib/mergeExtraction'
import { buildNewCaseData, type NewCaseInput } from '@/lib/createCase'

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
  isAuthenticating: boolean
  login: (name: string) => Promise<void>
  logout: () => void

  cases: Case[]
  casesLoading: boolean
  loadCases: () => Promise<void>
  createdCases: CaseData[]
  createCase: (input: NewCaseInput) => string

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
  mergeExtraction: (result: ExtractionResult, rawText: string, sourceType: EvidenceSourceType) => MergeSummary
}

export const useAppStore = create<AppState>((set, get) => ({
  investigatorName: null,
  isAuthenticating: false,
  login: async (name: string) => {
    set({ isAuthenticating: true })
    await new Promise((r) => setTimeout(r, 900))
    set({ investigatorName: name, isAuthenticating: false })
  },
  logout: () => set({ investigatorName: null }),

  cases: [],
  casesLoading: false,
  loadCases: async () => {
    set({ casesLoading: true })
    const cases = await fetchCases()
    set((s) => ({ cases: [...cases, ...s.createdCases.map((c) => c.case)], casesLoading: false }))
  },
  createdCases: [],
  createCase: (input) => {
    const data = buildNewCaseData(input)
    set((s) => ({ createdCases: [...s.createdCases, data], cases: [...s.cases, data.case] }))
    return data.case.id
  },

  activeCaseData: null,
  activeCaseLoading: false,
  loadCase: async (caseId: string) => {
    set({
      activeCaseLoading: true,
      selectedEntityId: null,
      filters: defaultFilters(),
      focusRequest: null,
    })
    const created = get().createdCases.find((c) => c.case.id === caseId)
    const data = created ?? (await fetchCaseData(caseId))
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
  mergeExtraction: (result, rawText, sourceType) => {
    const current = get().activeCaseData
    if (!current) return { entitiesAdded: 0, entitiesLinked: 0, relationshipsAdded: 0 }
    const { data, summary } = mergeExtractionIntoCase(current, result, rawText, sourceType)
    set((s) => ({
      activeCaseData: data,
      createdCases: s.createdCases.some((c) => c.case.id === data.case.id)
        ? s.createdCases.map((c) => (c.case.id === data.case.id ? data : c))
        : s.createdCases,
    }))
    return summary
  },
}))
