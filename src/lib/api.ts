import type { Case, CaseData } from '@/types'

export async function fetchCases(): Promise<Case[]> {
  const res = await fetch('/api/cases')
  if (!res.ok) throw new Error(`Failed to load cases (${res.status})`)
  return res.json()
}

export async function fetchCaseData(caseId: string): Promise<CaseData> {
  const res = await fetch(`/api/case-data?id=${encodeURIComponent(caseId)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string })
    throw new Error(body.error ?? `Unknown case: ${caseId}`)
  }
  return res.json()
}

export interface CreateCaseInput {
  name: string
  caseNumber?: string
  jurisdiction: string
  leadInvestigator: string
  summary: string
}

export async function createCase(input: CreateCaseInput): Promise<Case> {
  const res = await fetch('/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string })
    throw new Error(body.error ?? `Failed to create case (${res.status})`)
  }
  return res.json()
}
