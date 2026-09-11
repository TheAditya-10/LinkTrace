import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Loader2, UserRound, Shield, Fingerprint } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { UserRole } from '@/types'

const credentialProfiles = [
  { id: 'ANL-4471', password: 'linktrace-analyst', name: 'A. Sharma', role: 'analyst' as const, label: 'Analyst', description: 'Case investigation workspace', icon: UserRound },
  { id: 'SUP-1001', password: 'linktrace-supervisor', name: 'V. Singh', role: 'supervisor' as const, label: 'Supervisor', description: 'Case workspace and command overview', icon: Shield },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAppStore((s) => s.login)
  const isAuthenticating = useAppStore((s) => s.isAuthenticating)
  const [investigatorId, setInvestigatorId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function fillCredentials(profile: (typeof credentialProfiles)[number]) {
    setInvestigatorId(profile.id)
    setPassword(profile.password)
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const profile = credentialProfiles.find(
      (candidate) => candidate.id === investigatorId.trim() && candidate.password === password,
    )

    if (!profile) {
      setError('Use one of the provided credential profiles.')
      return
    }

    await login(profile.name, profile.role as UserRole)
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

        <form onSubmit={handleSubmit} className="panel space-y-4 p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-ink-900">Sign in to LinkTrace</p>
            <p className="mt-1 text-xs text-ink-500">Choose a profile to fill its credentials, then sign in.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {credentialProfiles.map((profile) => {
              const Icon = profile.icon
              return (
                <button
                  key={profile.role}
                  type="button"
                  onClick={() => fillCredentials(profile)}
                  disabled={isAuthenticating}
                  className="flex items-center gap-2 rounded-lg border border-base-border bg-base-muted p-3 text-left transition hover:border-accent/40 hover:bg-accent-bg disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Icon className="h-4 w-4 shrink-0 text-accent" />
                  <span className="min-w-0"><span className="block text-xs font-semibold text-ink-900">{profile.label}</span><span className="block truncate text-[11px] text-ink-500">{profile.name} · {profile.id}</span></span>
                </button>
              )
            })}
          </div>
          <div>
            <label htmlFor="investigatorId" className="mb-1.5 block text-xs font-medium text-ink-500">Investigator ID</label>
            <input id="investigatorId" value={investigatorId} onChange={(event) => setInvestigatorId(event.target.value)} placeholder="e.g. ANL-4471" disabled={isAuthenticating} className="w-full rounded-lg border border-base-border bg-base-muted px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/30 disabled:cursor-not-allowed" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-500">Password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" disabled={isAuthenticating} className="w-full rounded-lg border border-base-border bg-base-muted px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/30 disabled:cursor-not-allowed" />
          </div>
          {error && <p className="text-xs text-risk-critical">{error}</p>}
          <button type="submit" disabled={isAuthenticating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100">
            {isAuthenticating ? <><Loader2 className="motion-loading h-4 w-4 animate-spin" /> Authenticating…</> : <><Fingerprint className="h-4 w-4" /> Sign in</>}
          </button>
        </form>
        <p className="mt-4 text-center text-[11px] text-ink-400">
          Secure access · Role-based investigative dashboard · Session audit-logged
        </p>
      </div>
    </div>
  )
}
