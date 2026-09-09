import { useEffect } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { EntityDetailPanel } from '@/components/EntityDetailPanel'
import { AlertsPanel } from '@/components/AlertsPanel'
import { LoadingState } from '@/components/ui/LoadingState'

export default function CaseWorkspace() {
  const { caseId } = useParams()
  const activeCaseData = useAppStore((s) => s.activeCaseData)
  const activeCaseLoading = useAppStore((s) => s.activeCaseLoading)
  const loadCase = useAppStore((s) => s.loadCase)
  const cases = useAppStore((s) => s.cases)
  const loadCases = useAppStore((s) => s.loadCases)

  useEffect(() => {
    if (cases.length === 0) loadCases()
  }, [cases.length, loadCases])

  useEffect(() => {
    if (caseId && activeCaseData?.case.id !== caseId) {
      loadCase(caseId)
    }
  }, [caseId, activeCaseData?.case.id, loadCase])

  const isLoading = activeCaseLoading || !activeCaseData || activeCaseData.case.id !== caseId

  return (
    <div className="flex h-screen flex-col bg-base-bg">
      {!isLoading && <Topbar />}
      <div className="flex min-h-0 flex-1">
        {!isLoading && <Sidebar />}
        <main className="min-w-0 flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingState label="Loading case network…" />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      {!isLoading && (
        <>
          <EntityDetailPanel />
          <AlertsPanel />
        </>
      )}
    </div>
  )
}
