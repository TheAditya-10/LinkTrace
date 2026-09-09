import { allCases, getCaseDataById } from '@/data'
import type { CaseData, Case } from '@/types'
import { delay } from './utils'

/**
 * Simulated backend. All data is local/static — the latency here exists
 * purely to sell the "processing" feel described in the product brief,
 * since a real deployment would be fetching from a graph pipeline.
 */

export async function fetchCases(): Promise<Case[]> {
  await delay(600)
  return allCases
}

export async function fetchCaseData(caseId: string): Promise<CaseData> {
  await delay(850)
  const data = getCaseDataById(caseId)
  if (!data) throw new Error(`Unknown case: ${caseId}`)
  return data
}

export async function fetchEvidenceLookup(delayMs = 450): Promise<void> {
  await delay(delayMs)
}
