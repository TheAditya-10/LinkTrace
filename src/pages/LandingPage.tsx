import { useNavigate } from 'react-router-dom'
import {
  Waypoints,
  Target,
  GitBranch,
  Clock,
  FileSearch,
  Bell,
  Search,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

const features = [
  { icon: Waypoints, title: 'Network Relationship Map', desc: 'Interactive force-directed graph of every entity and weighted relationship in a case.' },
  { icon: Target, title: 'Priority Connection Leads', desc: 'Ranked, filterable leads with a plain-language "why flagged" reason.' },
  { icon: GitBranch, title: 'Key & Bridge Entities', desc: 'Hub and bridge nodes surfaced automatically from the graph structure.' },
  { icon: Clock, title: 'Temporal Activity View', desc: 'Scrub through calls, transactions and movements as they unfolded.' },
  { icon: FileSearch, title: 'Evidence-to-Link Trace', desc: 'Every insight traces back to its source record — FIR, CDR, transaction, surveillance.' },
  { icon: Bell, title: 'Alerts', desc: 'New hidden connections, risk changes and contradictions surfaced as they happen.' },
]

const metrics = [
  { label: 'Suspect network mapping time', before: 'Days – weeks', after: '< 2 hours' },
  { label: 'Cases closed for lack of evidence / yr', before: '~7.5 lakh', after: '~4.5 lakh (-40%)' },
  { label: 'Manual cross-referencing effort', before: 'High', after: 'Low (automated)' },
]

const graphNodes = [
  { x: 18, y: 30, color: '#3b82f6', r: 16 },
  { x: 42, y: 14, color: '#a78bfa', r: 10 },
  { x: 68, y: 22, color: '#ec4899', r: 12 },
  { x: 30, y: 58, color: '#f97316', r: 11 },
  { x: 58, y: 52, color: '#10b981', r: 13 },
  { x: 82, y: 46, color: '#14b8a6', r: 9 },
  { x: 50, y: 80, color: '#3b82f6', r: 10 },
  { x: 78, y: 78, color: '#a78bfa', r: 8 },
]
const graphLinks: [number, number, boolean][] = [
  [0, 1, false], [1, 2, false], [0, 3, false], [3, 4, true],
  [4, 5, false], [2, 5, false], [4, 6, false], [6, 7, true], [3, 6, false],
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-base-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent-bg">
            <ShieldCheck className="h-4 w-4 text-accent" />
          </div>
          <span className="font-sans text-sm font-bold tracking-tight text-ink-900">LinkTrace</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-dim"
        >
          Sign in
        </button>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="eyebrow mb-4">SIH 2026 · Problem Statement 189 · Dev-Lok</p>
          <h1 className="mb-5 font-sans text-4xl font-bold leading-tight tracking-tight text-ink-900 lg:text-5xl">
            Trace the links your case file can't show you.
          </h1>
          <p className="mb-7 max-w-lg text-sm leading-relaxed text-ink-500">
            LinkTrace fuses fragmented evidence — FIRs, call records, transactions, surveillance,
            social media — into a single evidence-weighted knowledge graph, so investigators can see
            hidden connections between people, assets and cases in hours, not weeks.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dim"
            >
              Launch Dashboard <ArrowRight className="h-4 w-4" />
            </button>
            <span className="text-xs text-ink-400">Frontend prototype · mock data throughout</span>
          </div>
        </div>

        <div className="panel relative aspect-[4/3] overflow-hidden p-2">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <defs>
              <pattern id="landing-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#E2E8F3" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#landing-grid)" />
            {graphLinks.map(([a, b, predicted], i) => (
              <line
                key={i}
                x1={graphNodes[a].x}
                y1={graphNodes[a].y}
                x2={graphNodes[b].x}
                y2={graphNodes[b].y}
                stroke={predicted ? '#c4b5fd' : '#93c5fd'}
                strokeWidth={0.8}
                strokeDasharray={predicted ? '2 1.5' : undefined}
              />
            ))}
            {graphNodes.map((n, i) => (
              <circle key={i} cx={n.x} cy={n.y} r={n.r / 4} fill={n.color} fillOpacity={0.85}>
                <animate
                  attributeName="opacity"
                  values="0.6;1;0.6"
                  dur={`${3 + (i % 3)}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </svg>
        </div>
      </section>

      <section className="border-y border-base-border bg-base-surface py-12">
        <div className="mx-auto max-w-6xl px-6">
          <p className="eyebrow mb-6 text-center">Illustrative impact</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {metrics.map((m) => (
              <div key={m.label} className="panel p-5 text-center">
                <p className="mb-3 text-xs text-ink-500">{m.label}</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm text-ink-400 line-through">{m.before}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-ink-300" />
                  <span className="text-base font-bold text-accent">{m.after}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="eyebrow mb-2 text-center">Everything in one workspace</p>
        <h2 className="mb-10 text-center font-sans text-2xl font-bold text-ink-900">
          Built for how investigators actually work
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="panel p-5">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-bg text-accent">
                <f.icon className="h-4 w-4" />
              </span>
              <p className="mb-1 text-sm font-semibold text-ink-900">{f.title}</p>
              <p className="text-xs text-ink-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="panel flex flex-col items-center gap-4 p-10 text-center">
          <Search className="h-6 w-6 text-accent" />
          <h3 className="font-sans text-xl font-bold text-ink-900">See a case's full network in minutes</h3>
          <p className="max-w-md text-sm text-ink-500">
            Sign in with any investigator ID to explore three sample cases, fully wired with entities,
            evidence, and analytics.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dim"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-base-border py-6 text-center text-[11px] text-ink-400">
        LinkTrace · SIH 2026 Problem Statement 189 · Prototype build, mock data throughout
      </footer>
    </div>
  )
}
