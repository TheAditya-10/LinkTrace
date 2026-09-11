import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Loader2, UserRound, Shield } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { UserRole } from '@/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAppStore((s) => s.login)
  const isAuthenticating = useAppStore((s) => s.isAuthenticating)

  async function handleLogin(role: UserRole) {
    const name = role === 'supervisor' ? 'Supervisor' : 'Analyst'
    await login(name, role)
    navigate('/cases')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base-bg px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.06) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent/30 bg-accent-bg shadow-glow">
            <ShieldCheck className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="font-sans text-xl font-bold tracking-tight text-ink-900">LinkTrace</h1>
            <p className="mono-tag">Investigative Link Analysis Platform</p>
          </div>
        </div>

        <div className="panel space-y-3 p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-ink-900">Select credentials</p>
            <p className="mt-1 text-xs text-ink-500">Your role determines the views available in this session.</p>
          </div>
          {isAuthenticating ? (
            <div className="flex justify-center gap-2 py-4 text-sm font-medium text-accent">
              <Loader2 className="motion-loading h-4 w-4 animate-spin" /> Authenticating…
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleLogin('analyst')}
                className="flex w-full items-center gap-3 rounded-lg border border-base-border bg-base-muted p-3 text-left transition hover:border-accent/40 hover:bg-accent-bg active:scale-[0.98]"
              >
                <UserRound className="h-5 w-5 shrink-0 text-ink-500" />
                <span><span className="block text-sm font-semibold text-ink-900">Analyst</span><span className="text-xs text-ink-500">Case investigation workspace</span></span>
              </button>
              <button
                type="button"
                onClick={() => handleLogin('supervisor')}
                className="flex w-full items-center gap-3 rounded-lg border border-accent/40 bg-accent-bg p-3 text-left transition hover:border-accent hover:bg-accent-bg/70 active:scale-[0.98]"
              >
                <Shield className="h-5 w-5 shrink-0 text-accent" />
                <span><span className="block text-sm font-semibold text-ink-900">Supervisor</span><span className="text-xs text-ink-500">Case workspace and command overview</span></span>
              </button>
            </>
          )}
        </div>
        <p className="mt-4 text-center text-[11px] text-ink-400">
          Secure access · Role-based investigative dashboard · Session audit-logged
        </p>
      </div>
    </div>
  )
}
