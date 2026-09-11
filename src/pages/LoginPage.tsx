import { useState, type FormEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileCheck2,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
  Shield,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { UserRole } from '@/types'

const credentialProfiles = [
  { id: 'ANL-4471', password: 'linktrace-analyst', name: 'A. Sharma', role: 'analyst' as const, label: 'Analyst', description: 'Case investigation workspace', icon: UserRound },
  { id: 'SUP-1001', password: 'linktrace-supervisor', name: 'V. Singh', role: 'supervisor' as const, label: 'Supervisor', description: 'Case workspace and command overview', icon: Shield },
]

const evidenceLinks = [
  [50, 50, 18, 23],
  [50, 50, 79, 20],
  [50, 50, 82, 74],
  [50, 50, 23, 79],
  [50, 50, 64, 39],
]

const evidenceNodes = [
  { x: 50, y: 50, r: 7, color: '#22D3EE' },
  { x: 18, y: 23, r: 4, color: '#A78BFA' },
  { x: 79, y: 20, r: 4, color: '#10B981' },
  { x: 82, y: 74, r: 4, color: '#F97316' },
  { x: 23, y: 79, r: 4, color: '#3B82F6' },
  { x: 64, y: 39, r: 3.5, color: '#EC4899' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
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

  const revealInitial = prefersReducedMotion ? false : { opacity: 0, y: 16, filter: 'blur(4px)' }
  const revealTransition = { duration: 0.42, ease: [0.32, 0.72, 0, 1] as const }

  return (
    <main className="min-h-screen bg-base-bg p-3 sm:p-5 lg:h-screen lg:min-h-0 lg:overflow-hidden lg:p-6">
      <div className="relative isolate mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1440px] overflow-hidden rounded-2xl border border-base-border bg-base-surface shadow-panel sm:min-h-[calc(100vh-2.5rem)] lg:h-[calc(100vh-3rem)] lg:min-h-0 lg:grid-cols-[minmax(0,0.93fr)_minmax(31rem,0.87fr)]">
        <section className="relative overflow-hidden bg-base-navy px-6 py-6 text-ink-inverse sm:px-10 sm:py-9 lg:flex lg:min-h-0 lg:flex-col lg:px-12 lg:py-8" aria-labelledby="access-context-heading">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)',
              backgroundSize: '38px 38px',
            }}
          />
          <div className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative flex items-center justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg -ml-2 px-2 py-2 text-sm font-medium text-ink-inverse/75 transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/10 hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:ring-offset-2 focus-visible:ring-offset-base-navy"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Overview</span>
            </Link>
            <span className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-accent-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-soft" /> Secure gateway
            </span>
          </div>

          <motion.div initial={revealInitial} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={revealTransition} className="relative mt-12 max-w-md lg:mt-14">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent-soft/25 bg-accent/10 text-accent-soft shadow-glow">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="mt-8 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-accent-soft">LinkTrace / protected workspace</p>
            <h1 id="access-context-heading" className="mt-4 text-4xl font-semibold tracking-tight text-white text-balance sm:text-5xl">
              Enter with the evidence trail intact.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-ink-inverse/70 sm:text-base sm:leading-7">
              A focused workspace for reviewing connections, examining source records, and preparing defensible case briefings.
            </p>
          </motion.div>

          <motion.figure
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ ...revealTransition, delay: prefersReducedMotion ? 0 : 0.1 }}
            className="relative mt-10 max-w-lg lg:mt-auto"
          >
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-1 pb-3">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-inverse/55"><FileCheck2 className="h-3.5 w-3.5 text-accent-soft" /> Evidence context</span>
                <span className="font-mono text-[10px] text-ink-inverse/45">SAMPLE / 06</span>
              </div>
              <div className="relative mt-3 aspect-[1.7/1] overflow-hidden rounded-lg border border-white/10 bg-[#09111F]">
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
                  <defs>
                    <pattern id="access-evidence-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                      <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#334155" strokeWidth="0.3" />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#access-evidence-grid)" />
                  {evidenceLinks.map(([x1, y1, x2, y2], index) => (
                    <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={index === 4 ? '#A78BFA' : '#22D3EE'} strokeDasharray={index === 4 ? '2 1.5' : undefined} strokeOpacity={index === 4 ? 0.75 : 0.55} strokeWidth="0.75" />
                  ))}
                  {evidenceNodes.map((node, index) => (
                    <g key={`${node.x}-${node.y}`}>
                      <circle cx={node.x} cy={node.y} r={node.r + 2} fill={node.color} fillOpacity="0.12" />
                      <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} />
                      {index === 0 && <circle cx={node.x} cy={node.y} r="2.3" fill="#F8FAFC" />}
                    </g>
                  ))}
                </svg>
                <span className="absolute left-[8%] top-[10%] rounded border border-white/10 bg-base-navy/90 px-1.5 py-1 font-mono text-[9px] uppercase tracking-wide text-ink-inverse/65">Call record</span>
                <span className="absolute bottom-[12%] right-[8%] rounded border border-white/10 bg-base-navy/90 px-1.5 py-1 font-mono text-[9px] uppercase tracking-wide text-ink-inverse/65">Field note</span>
              </div>
            </div>
            <figcaption className="mt-3 flex items-start gap-2 text-xs leading-5 text-ink-inverse/55">
              <span className="mt-2 h-px w-5 shrink-0 bg-accent-soft/70" />
              Observed records and reviewable leads remain distinct throughout the workspace.
            </figcaption>
          </motion.figure>
        </section>

        <section className="relative flex items-center px-6 py-10 sm:px-10 lg:px-14 lg:py-7" aria-labelledby="sign-in-heading">
          <div className="mx-auto w-full max-w-md">
            <motion.div initial={revealInitial} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ ...revealTransition, delay: prefersReducedMotion ? 0 : 0.08 }}>
              <div className="flex items-start justify-between gap-4 border-b border-base-border pb-5 lg:pb-4">
                <div>
                  <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-accent-dim">Access record / 01</p>
                  <h2 id="sign-in-heading" className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">Sign in to LinkTrace</h2>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-bg text-accent-dim"><LockKeyhole className="h-4 w-4" /></span>
              </div>
              <p className="mt-5 text-sm leading-6 text-ink-500 lg:mt-4">Choose a sample access profile to enter its credentials, then authenticate to the workspace.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="mt-8 lg:mt-6">
              <fieldset disabled={isAuthenticating}>
                <legend className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Select access profile</legend>
                <div className="mt-3 divide-y divide-base-border border-y border-base-border">
                  {credentialProfiles.map((profile, index) => {
                    const Icon = profile.icon
                    const isSelected = investigatorId === profile.id && password === profile.password

                    return (
                      <button
                        key={profile.role}
                        type="button"
                        onClick={() => fillCredentials(profile)}
                        aria-pressed={isSelected}
                        className="group flex w-full items-center gap-4 px-1 py-4 text-left transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-base-muted/80 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 lg:py-3"
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${isSelected ? 'bg-accent text-base-navy' : 'bg-base-muted text-accent-dim group-hover:bg-accent-bg'}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink-900">{profile.label} <span className="font-normal text-ink-400">/ {profile.name}</span></span>
                          <span className="mt-0.5 block truncate text-xs text-ink-500">{profile.description} · {profile.id}</span>
                        </span>
                        <span className={`font-mono text-[11px] transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${isSelected ? 'text-accent-dim' : 'text-ink-400'}`}>{String(index + 1).padStart(2, '0')}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-7 grid gap-5 lg:mt-5 lg:gap-4">
                  <div>
                    <label htmlFor="investigatorId" className="flex items-center justify-between gap-4 text-xs font-medium text-ink-700">
                      Investigator ID
                      <span className="font-mono text-[10px] uppercase tracking-wide text-ink-400">Required credential</span>
                    </label>
                    <input
                      id="investigatorId"
                      value={investigatorId}
                      onChange={(event) => setInvestigatorId(event.target.value)}
                      placeholder="e.g. ANL-4471"
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? 'credentials-error' : undefined}
                      className="mt-2 w-full border-b border-base-border bg-transparent px-0 py-3 text-base text-ink-900 outline-none transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-ink-400 focus:border-accent focus:ring-0 disabled:cursor-not-allowed disabled:text-ink-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="flex items-center justify-between gap-4 text-xs font-medium text-ink-700">
                      Password
                      <KeyRound className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter password"
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? 'credentials-error' : undefined}
                      className="mt-2 w-full border-b border-base-border bg-transparent px-0 py-3 text-base text-ink-900 outline-none transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-ink-400 focus:border-accent focus:ring-0 disabled:cursor-not-allowed disabled:text-ink-500"
                    />
                  </div>
                </div>
              </fieldset>

              {error && (
                <p id="credentials-error" role="alert" className="mt-5 flex items-start gap-2 border-l-2 border-risk-critical bg-risk-critical/5 px-3 py-2.5 text-xs leading-5 text-risk-critical">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-risk-critical" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-base-navy px-4 py-3 text-sm font-semibold text-white shadow-card transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-base-navy-soft active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base-surface disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:active:scale-100 lg:mt-5"
              >
                {isAuthenticating ? <><Loader2 className="motion-loading h-4 w-4 animate-spin" /> Authenticating…</> : <><Fingerprint className="h-4 w-4 transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-[-8deg]" /> Authenticate access</>}
              </button>
            </form>

            <div className="mt-7 grid grid-cols-3 gap-3 border-t border-base-border pt-5 text-center lg:mt-5 lg:pt-4">
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink-400">Role-based</span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink-400">Audit logged</span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink-400">Sample data</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
