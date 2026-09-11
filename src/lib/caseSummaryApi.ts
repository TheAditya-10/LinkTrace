import type { CaseData, CaseSummary } from '@/types'

export async function generateCaseSummary(caseData: CaseData): Promise<CaseSummary> {
  const { case: c, entities, relationships, evidence, timeline } = caseData

  const res = await fetch('/api/case-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      case: {
        name: c.name,
        caseNumber: c.caseNumber,
        status: c.status,
        jurisdiction: c.jurisdiction,
        leadInvestigator: c.leadInvestigator,
        summary: c.summary,
        openedDate: c.openedDate,
      },
      entities: entities.map((e) => ({
        id: e.id,
        type: e.type,
        label: e.label,
        aliases: e.aliases,
        attributes: e.attributes,
        riskScore: e.riskScore,
      })),
      relationships: relationships.map((r) => ({
        sourceId: r.sourceId,
        targetId: r.targetId,
        type: r.type,
        label: r.label,
        description: r.description,
        predicted: r.predicted,
      })),
      evidence: evidence.map((ev) => ({
        sourceType: ev.sourceType,
        title: ev.title,
        excerpt: ev.excerpt,
        timestamp: ev.timestamp,
        reliability: ev.reliability,
      })),
      timeline: timeline.map((t) => ({
        timestamp: t.timestamp,
        title: t.title,
        description: t.description,
      })),
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string })
    throw new Error(body.error ?? `Case summary failed (${res.status})`)
  }

  return res.json()
}
