import { useNavigate, useParams } from 'react-router-dom'
import { X, Bell, Link2, TrendingUp, TriangleAlert, FileStack } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { priorityColor } from '@/lib/entityMeta'
import { formatRelative } from '@/lib/utils'
import type { AlertType } from '@/types'

const alertIcon: Record<AlertType, typeof Link2> = {
  new_link: Link2,
  risk_change: TrendingUp,
  contradiction: TriangleAlert,
  new_evidence: FileStack,
}

export function AlertsPanel() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const alertsOpen = useAppStore((s) => s.alertsOpen)
  const setAlertsOpen = useAppStore((s) => s.setAlertsOpen)
  const activeCaseData = useAppStore((s) => s.activeCaseData)
  const readAlertIds = useAppStore((s) => s.readAlertIds)
  const markAlertRead = useAppStore((s) => s.markAlertRead)
  const selectEntity = useAppStore((s) => s.selectEntity)
  const requestFocus = useAppStore((s) => s.requestFocus)

  if (!alertsOpen || !activeCaseData) return null

  const alerts = [...activeCaseData.alerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  function handleClick(alertId: string, entityId?: string, relationshipId?: string) {
    markAlertRead(alertId)
    if (relationshipId) {
      requestFocus({ relationshipId })
      navigate(`/case/${caseId}/evidence?relationshipId=${relationshipId}`)
    } else if (entityId) {
      requestFocus({ entityId })
      navigate(`/case/${caseId}/network`)
      selectEntity(entityId)
    }
    setAlertsOpen(false)
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Close"
        onClick={() => setAlertsOpen(false)}
        className="absolute inset-0 bg-ink-900/30 backdrop-blur-[1px]"
      />
      <div className="relative flex h-full w-full max-w-sm flex-col border-l border-base-border bg-base-surface shadow-panel animate-[slideIn_0.2s_ease-out]">
        <div className="flex items-center justify-between border-b border-base-border p-5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-accent" />
            <h2 className="font-sans text-base font-bold text-ink-900">Alerts</h2>
          </div>
          <button
            onClick={() => setAlertsOpen(false)}
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-muted hover:text-ink-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {alerts.length === 0 ? (
            <EmptyState title="No alerts for this case" />
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => {
                const Icon = alertIcon[alert.type]
                const isRead = alert.read || readAlertIds.has(alert.id)
                return (
                  <button
                    key={alert.id}
                    onClick={() => handleClick(alert.id, alert.targetEntityId, alert.targetRelationshipId)}
                    className="flex w-full items-start gap-3 rounded-lg border border-base-border p-3 text-left transition hover:border-accent/40 hover:bg-base-muted"
                  >
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${priorityColor[alert.priority]}1a`, color: priorityColor[alert.priority] }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-ink-900">{alert.title}</span>
                        {!isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-ink-500">{alert.description}</span>
                      <span className="mt-1 flex items-center gap-1.5">
                        <Badge color={priorityColor[alert.priority]}>{alert.priority}</Badge>
                        <span className="text-[10px] text-ink-400">{formatRelative(alert.timestamp)}</span>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
