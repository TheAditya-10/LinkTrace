import { ArrowRight } from 'lucide-react'
import { entityIcon, entityColorVar, entityLabel, roleColor, roleLabel } from '@/lib/entityMeta'
import type { ExtractionResult } from '@/types'

interface ExtractionReviewProps {
  result: ExtractionResult
  excludedEntities: Set<string>
  onToggleEntity: (tempId: string) => void
  excludedRelationships: Set<number>
  onToggleRelationship: (index: number) => void
}

/** Shared checkable preview of a Gemini extraction result, used by both the
 * standalone AI Extraction panel and the New Case flow's initial-evidence step. */
export function ExtractionReview({
  result,
  excludedEntities,
  onToggleEntity,
  excludedRelationships,
  onToggleRelationship,
}: ExtractionReviewProps) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-ink-500">
        Review before adding — uncheck anything that looks wrong. Entities matching an existing label/alias will be
        linked to that entity instead of duplicated.
      </p>

      {result.caseSummary && (
        <div className="rounded-lg border border-accent/30 bg-accent-bg p-3">
          <p className="eyebrow mb-1">Detected crime summary</p>
          <p className="text-xs text-ink-700">{result.caseSummary}</p>
        </div>
      )}

      <section>
        <p className="eyebrow mb-2">Entities ({result.entities.length})</p>
        <div className="space-y-1.5">
          {result.entities.map((e) => {
            const Icon = entityIcon[e.type]
            const excluded = excludedEntities.has(e.tempId)
            return (
              <label
                key={e.tempId}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${
                  excluded ? 'border-base-border bg-base-muted opacity-50' : 'border-base-border bg-base-surface'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!excluded}
                  onChange={() => onToggleEntity(e.tempId)}
                  className="accent-accent"
                />
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${entityColorVar[e.type]}1a`, color: entityColorVar[e.type] }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-medium text-ink-900">{e.label}</span>
                    {e.role && (
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: roleColor[e.role] }}
                      >
                        {roleLabel[e.role]}
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-ink-400">
                    {entityLabel[e.type]}
                    {e.aliases.length > 0 && ` · aka ${e.aliases.join(', ')}`}
                  </span>
                </span>
                <span className="mono-tag shrink-0">{Math.round(e.confidence * 100)}%</span>
              </label>
            )
          })}
        </div>
      </section>

      <section>
        <p className="eyebrow mb-2">Relationships ({result.relationships.length})</p>
        <div className="space-y-1.5">
          {result.relationships.length === 0 && (
            <p className="text-xs text-ink-400">No relationships extracted between the entities above.</p>
          )}
          {result.relationships.map((r, i) => {
            const s = result.entities.find((e) => e.tempId === r.sourceTempId)
            const t = result.entities.find((e) => e.tempId === r.targetTempId)
            const excluded = excludedRelationships.has(i)
            return (
              <label
                key={i}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition ${
                  excluded ? 'border-base-border bg-base-muted opacity-50' : 'border-base-border bg-base-surface'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!excluded}
                  onChange={() => onToggleRelationship(i)}
                  className="mt-0.5 accent-accent"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1 text-xs font-medium text-ink-900">
                    {s?.label ?? '?'} <ArrowRight className="h-3 w-3 text-ink-300" /> {t?.label ?? '?'}
                  </span>
                  <span className="block text-[11px] text-ink-400">
                    {r.type} · {r.description || r.label}
                  </span>
                </span>
                <span className="mono-tag shrink-0">{Math.round(r.confidence * 100)}%</span>
              </label>
            )
          })}
        </div>
      </section>
    </div>
  )
}
