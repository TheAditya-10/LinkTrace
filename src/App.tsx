import { Navigate, Route, Routes } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import CaseSelectorPage from '@/pages/CaseSelectorPage'
import CommandOverviewPage from '@/pages/CommandOverviewPage'
import CaseWorkspace from '@/pages/CaseWorkspace'
import NetworkMapView from '@/pages/case/NetworkMapView'
import PriorityLeadsView from '@/pages/case/PriorityLeadsView'
import KeyEntitiesView from '@/pages/case/KeyEntitiesView'
import TimelineView from '@/pages/case/TimelineView'
import EvidenceTraceView from '@/pages/case/EvidenceTraceView'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const investigatorName = useAppStore((s) => s.investigatorName)
  if (!investigatorName) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/cases"
        element={
          <RequireAuth>
            <CaseSelectorPage />
          </RequireAuth>
        }
      />
      <Route
        path="/command-overview"
        element={
          <RequireAuth>
            <CommandOverviewPage />
          </RequireAuth>
        }
      />
      <Route
        path="/case/:caseId"
        element={
          <RequireAuth>
            <CaseWorkspace />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="network" replace />} />
        <Route path="network" element={<NetworkMapView />} />
        <Route path="leads" element={<PriorityLeadsView />} />
        <Route path="entities" element={<KeyEntitiesView />} />
        <Route path="timeline" element={<TimelineView />} />
        <Route path="evidence" element={<EvidenceTraceView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
