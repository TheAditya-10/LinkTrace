import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { Waypoints, Target, GitBranch, Clock, FileSearch, LayoutGrid, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: 'network', label: 'Network Map', icon: Waypoints },
  { to: 'leads', label: 'Priority Leads', icon: Target },
  { to: 'entities', label: 'Key & Bridge', icon: GitBranch },
  { to: 'timeline', label: 'Temporal', icon: Clock },
  { to: 'evidence', label: 'Evidence Trace', icon: FileSearch },
]

export function Sidebar() {
  const { caseId } = useParams()
  const navigate = useNavigate()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-base-border bg-base-surface">
      <div className="flex-1 overflow-y-auto px-4 pt-5">
        <p className="eyebrow mb-2 px-2">Forensic Views</p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={`/case/${caseId}/${item.to}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-accent-bg text-accent'
                    : 'text-ink-500 hover:bg-base-muted hover:text-ink-900',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="border-t border-base-border px-4 py-4">
        <button
          onClick={() => navigate('/command-overview')}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-500 transition hover:bg-base-muted hover:text-ink-900"
        >
          <LayoutGrid className="h-4 w-4" /> Command Overview
        </button>
        <button
          onClick={() => navigate('/cases')}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-500 transition hover:bg-base-muted hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" /> All Cases
        </button>
      </div>
    </aside>
  )
}
