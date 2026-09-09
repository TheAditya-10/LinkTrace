import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Search, Bell, ShieldCheck, Waypoints, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Badge } from '@/components/ui/Badge'
import { entityIcon, entityColorVar } from '@/lib/entityMeta'
import type { CaseStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusLabel: Record<CaseStatus, string> = {
  active: 'Active',
  under_review: 'Under Review',
  closed: 'Closed',
}

const statusColor: Record<CaseStatus, string> = {
  active: '#06b6d4',
  under_review: '#f59e0b',
  closed: '#64748b',
}

const riskBarColor: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

export function Topbar() {
  const navigate = useNavigate()
  const investigatorName = useAppStore((s) => s.investigatorName)
  const cases = useAppStore((s) => s.cases)
  const activeCaseData = useAppStore((s) => s.activeCaseData)
  const loadCase = useAppStore((s) => s.loadCase)
  const selectEntity = useAppStore((s) => s.selectEntity)
  const alertsOpen = useAppStore((s) => s.alertsOpen)
  const setAlertsOpen = useAppStore((s) => s.setAlertsOpen)
  const readAlertIds = useAppStore((s) => s.readAlertIds)
  const setAiExtractOpen = useAppStore((s) => s.setAiExtractOpen)

  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const matches = useMemo(() => {
    if (!activeCaseData || !query.trim()) return []
    const q = query.trim().toLowerCase()
    return activeCaseData.entities
      .filter((e) => e.label.toLowerCase().includes(q) || e.aliases.some((a) => a.toLowerCase().includes(q)))
      .slice(0, 8)
  }, [activeCaseData, query])

  const unreadCount = activeCaseData
    ? activeCaseData.alerts.filter((a) => !a.read && !readAlertIds.has(a.id)).length
    : 0

  async function handleSwitch(caseId: string) {
    setSwitcherOpen(false)
    await loadCase(caseId)
    navigate(`/case/${caseId}/network`)
  }

  if (!activeCaseData) return null
  const { case: activeCase } = activeCaseData

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-base-border bg-base-surface px-5">
      <button
        onClick={() => navigate('/cases')}
        className="flex items-center gap-2 shrink-0"
        title="Back to Case Dashboard"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent-bg">
          <Waypoints className="h-4 w-4 text-accent" />
        </div>
        <span className="font-sans text-sm font-bold tracking-tight text-ink-900">LinkTrace</span>
      </button>

      <div ref={switcherRef} className="relative shrink-0">
        <button
          onClick={() => setSwitcherOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-lg border border-base-border bg-base-surface px-3 py-1.5 text-left transition hover:border-accent/40"
        >
          <span
            className="h-6 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: riskBarColor[activeCase.riskLevel] }}
          />
          <span>
            <span className="block text-sm font-semibold leading-tight text-ink-900">{activeCase.name}</span>
            <span className="mono-tag block leading-tight">{activeCase.caseNumber}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
        </button>
        {switcherOpen && (
          <div className="absolute left-0 top-full z-30 mt-1.5 w-72 overflow-hidden rounded-xl border border-base-border bg-base-surface shadow-panel">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSwitch(c.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-base-muted',
                  c.id === activeCase.id && 'bg-accent-bg',
                )}
              >
                <span
                  className="h-6 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: riskBarColor[c.riskLevel] }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink-900">{c.name}</span>
                  <span className="mono-tag block">{c.caseNumber}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Badge color={statusColor[activeCase.status]} variant="solid" className="shrink-0">
        {statusLabel[activeCase.status]}
      </Badge>

      <div ref={searchRef} className="relative ml-auto w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSearchOpen(true)
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search entities…"
          className="w-full rounded-lg border border-base-border bg-base-muted py-2 pl-9 pr-12 text-sm text-ink-900 outline-none transition focus:border-accent/50 focus:bg-base-surface"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-base-border bg-base-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-400">
          ⌘K
        </kbd>
        {searchOpen && query.trim() && (
          <div className="absolute left-0 top-full z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-base-border bg-base-surface shadow-panel">
            {matches.length === 0 ? (
              <p className="px-3 py-3 text-xs text-ink-400">No entities match "{query}"</p>
            ) : (
              matches.map((entity) => {
                const Icon = entityIcon[entity.type]
                return (
                  <button
                    key={entity.id}
                    onClick={() => {
                      selectEntity(entity.id)
                      setSearchOpen(false)
                      setQuery('')
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-base-muted"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${entityColorVar[entity.type]}1a`, color: entityColorVar[entity.type] }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink-900">{entity.label}</span>
                      {entity.aliases.length > 0 && (
                        <span className="block truncate text-[11px] text-ink-400">aka {entity.aliases.join(', ')}</span>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setAiExtractOpen(true)}
        title="Extract entities from text with AI"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-base-border text-ink-500 transition hover:border-accent/40 hover:text-accent"
      >
        <Sparkles className="h-4 w-4" />
      </button>

      <button
        onClick={() => setAlertsOpen(!alertsOpen)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-base-border text-ink-500 transition hover:border-accent/40 hover:text-accent"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-risk-critical px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <div className="flex shrink-0 items-center gap-2 pl-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
          {investigatorName?.slice(0, 2).toUpperCase() ?? <ShieldCheck className="h-4 w-4" />}
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-semibold leading-tight text-ink-900">{investigatorName}</p>
          <p className="mono-tag leading-tight">Investigator</p>
        </div>
      </div>
    </header>
  )
}
