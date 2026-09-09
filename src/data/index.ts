import { operationBlackout } from './cases/operationBlackout'
import { fraudSyndicate } from './cases/fraudSyndicate'
import { harborRoad } from './cases/harborRoad'
import type { CaseData } from '@/types'

export const allCaseData: CaseData[] = [operationBlackout, fraudSyndicate, harborRoad]

export const allCases = allCaseData.map((c) => c.case)

export function getCaseDataById(id: string): CaseData | undefined {
  return allCaseData.find((c) => c.case.id === id)
}
