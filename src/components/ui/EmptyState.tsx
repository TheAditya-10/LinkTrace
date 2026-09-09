import type { ReactNode } from 'react'
import { SearchX } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-base-border-strong bg-base-muted px-6 py-12 text-center">
      <div className="mb-2 text-ink-300">{icon ?? <SearchX className="h-8 w-8" />}</div>
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      {description && <p className="max-w-sm text-xs text-ink-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
