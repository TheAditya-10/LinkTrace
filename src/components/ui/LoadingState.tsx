import { Radar } from 'lucide-react'

export function LoadingState({ label = 'Processing…' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-3 text-ink-500">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-accent/25" />
        <span className="absolute inset-0 animate-pulse-ring rounded-full" />
        <Radar className="h-6 w-6 animate-spin text-accent" style={{ animationDuration: '2.2s' }} />
      </div>
      <p className="mono-tag">{label}</p>
    </div>
  )
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-base-border/70 ${className}`} />
}
