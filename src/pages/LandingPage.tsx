import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  FileSearch,
  GitBranch,
  Landmark,
  MapPin,
  Network,
  Phone,
  ShieldCheck,
  TimerReset,
  UserRound,
  Waypoints,
} from 'lucide-react'

const heroNodes = [
  { id: 'origin', x: 46, y: 48, r: 6.2, color: '#3B82F6', label: 'Person of interest' },
  { id: 'phone', x: 20, y: 25, r: 4.1, color: '#A78BFA', label: 'Phone record' },
  { id: 'account', x: 77, y: 19, r: 4.6, color: '#10B981', label: 'Account activity' },
  { id: 'location', x: 77, y: 70, r: 4.1, color: '#F97316', label: 'Location record' },
  { id: 'vehicle', x: 25, y: 77, r: 3.8, color: '#14B8A6', label: 'Vehicle sighting' },
  { id: 'bridge', x: 63, y: 43, r: 3.6, color: '#EC4899', label: 'Bridge entity' },
]

const heroLinks: [number, number, boolean][] = [
  [0, 1, false],
  [0, 2, false],
  [0, 3, false],
  [0, 4, false],
  [0, 5, true],
  [5, 2, true],
]

const outcomes = [
  {
    icon: Waypoints,
    title: 'See the network before the briefing',
    description: 'Bring people, devices, locations, accounts, and events into one case view that makes clusters and bridge entities visible.',
  },
  {
    icon: FileSearch,
    title: 'Keep every finding defensible',
    description: 'Open the source record behind each relationship, including call data, financial activity, statements, and field observations.',
  },
  {
    icon: BellRing,
    title: 'Focus on leads worth checking',
    description: 'Prioritize unusual connections and contradictions with a clear reason for review instead of another unranked result list.',
  },
]

const workflow = [
  {
    step: '01',
    icon: FileSearch,
    title: 'Ingest case material',
    description: 'Start with the records already collected. LinkTrace extracts entities and preserves their source context.',
  },
  {
    step: '02',
    icon: Network,
    title: 'Review the connections',
    description: 'Inspect observed relationships, predicted leads, and the evidence that supports each path through the network.',
  },
  {
    step: '03',
    icon: BadgeCheck,
    title: 'Brief with confidence',
    description: 'Move from a promising lead to a reviewable narrative without losing the trail back to the original record.',
  },
]

const faqs = [
  {
    question: 'What evidence can LinkTrace bring together?',
    answer: 'The workspace is designed around records such as FIRs, call data, transaction activity, surveillance notes, documents, locations, and witness statements.',
  },
  {
    question: 'Can an investigator see why a relationship was flagged?',
    answer: 'Yes. Each relationship is designed to carry a reason and a path back to the relevant source records, so analysts can verify a lead before acting on it.',
  },
  {
    question: 'What is the difference between observed and predicted links?',
    answer: 'Observed links come directly from available material. Predicted links are leads for review and remain visually distinct so they are never presented as established fact.',
  },
  {
    question: 'Who is the sample workspace for?',
    answer: 'It is built for investigators and supervising officers who need to understand a case network, assess lead priority, and prepare evidence grounded briefings.',
  },
  {
    question: 'Does the prototype use live case information?',
    answer: 'No. The current workspace is a prototype and uses sample data throughout.',
  },
  {
    question: 'How do I enter the sample workspace?',
    answer: 'Select Open the sample workspace and choose either the analyst or supervisor profile on the sign in screen.',
  },
]

const taglineWords = 'Move from scattered records to a clear, reviewable chain of evidence.'.split(' ')
const easeOut = [0.32, 0.72, 0, 1] as const

function WordByWordTagline() {
  const prefersReducedMotion = useReducedMotion()
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [revealedWords, setRevealedWords] = useState<Set<number>>(() => new Set())

  useEffect(() => {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      setRevealedWords(new Set(taglineWords.map((_, index) => index)))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const index = Number((entry.target as HTMLElement).dataset.wordIndex)
          setRevealedWords((current) => {
            if (current.has(index)) return current
            const next = new Set(current)
            next.add(index)
            return next
          })
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -22% 0px', threshold: 0.7 },
    )

    wordRefs.current.forEach((word) => {
      if (word) observer.observe(word)
    })

    return () => observer.disconnect()
  }, [prefersReducedMotion])

  return (
    <section className="bg-base-navy px-6 py-20 text-ink-inverse sm:py-24" aria-labelledby="tagline-heading">
      <div className="mx-auto max-w-4xl">
        <p className="mb-6 font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent-soft">The LinkTrace method</p>
        <h2 id="tagline-heading" className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {taglineWords.map((word, index) => (
            <span
              key={`${word}-${index}`}
              ref={(element) => {
                wordRefs.current[index] = element
              }}
              data-word-index={index}
              className={`inline-block mr-2 transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${revealedWords.has(index) ? 'translate-y-0 text-ink-inverse opacity-100' : 'translate-y-1 text-ink-inverse/30 opacity-60'}`}
              style={{ transitionDelay: `${index * 65}ms` }}
            >
              {word}
            </span>
          ))}
        </h2>
      </div>
    </section>
  )
}

function EvidenceNetworkVisual() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="relative mx-auto w-full max-w-xl" aria-label="Sample evidence network showing records connected to a person of interest" role="img">
      <div className="relative overflow-hidden rounded-2xl border border-base-border bg-base-surface p-3 shadow-panel sm:p-4">
        <div className="flex items-center justify-between rounded-lg border border-base-border bg-base-muted px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-bg text-accent"><Network className="h-3.5 w-3.5" /></span>
            <div>
              <p className="text-xs font-semibold text-ink-900">Network review</p>
              <p className="font-mono text-xs text-ink-500">CASE 24 087</p>
            </div>
          </div>
          <span className="rounded-full border border-accent/20 bg-accent-bg px-2 py-1 font-mono text-xs text-accent">6 entities</span>
        </div>

        <div className="relative mt-3 aspect-[1.35/1] overflow-hidden rounded-lg border border-base-border bg-[#F8FAFD]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <pattern id="evidence-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#DDE6F1" strokeWidth="0.32" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#evidence-grid)" />
            {heroLinks.map(([from, to, predicted], index) => (
              <line
                key={`${from}-${to}`}
                pathLength={1}
                x1={heroNodes[from].x}
                y1={heroNodes[from].y}
                x2={heroNodes[to].x}
                y2={heroNodes[to].y}
                stroke={predicted ? '#A78BFA' : '#7DD3FC'}
                strokeDasharray={predicted ? '2 1.5' : undefined}
                strokeWidth={predicted ? 0.75 : 0.95}
                className={prefersReducedMotion ? '' : 'hero-line'}
                style={prefersReducedMotion ? undefined : { animationDelay: `${index * 90}ms`, animationDuration: '560ms' }}
              />
            ))}
            {heroNodes.map((node, index) => (
              <g key={node.id} className={prefersReducedMotion ? '' : 'hero-node'} style={prefersReducedMotion ? undefined : { animationDelay: `${280 + index * 85}ms` }}>
                <circle cx={node.x} cy={node.y} r={node.r + 1.9} fill={node.color} fillOpacity="0.13" />
                <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} />
                {node.id === 'origin' && <circle cx={node.x} cy={node.y} r={node.r - 2.2} fill="#FFFFFF" fillOpacity="0.9" />}
              </g>
            ))}
          </svg>

          <div className="absolute left-[10%] top-[14%] flex items-center gap-1.5 rounded-md border border-base-border bg-base-surface px-2 py-1 shadow-card">
            <Phone className="h-3 w-3 text-entity-phone" /><span className="font-mono text-xs text-ink-500">CDR</span>
          </div>
          <div className="absolute right-[7%] top-[9%] flex items-center gap-1.5 rounded-md border border-base-border bg-base-surface px-2 py-1 shadow-card">
            <Landmark className="h-3 w-3 text-entity-account" /><span className="font-mono text-xs text-ink-500">txn</span>
          </div>
          <div className="absolute bottom-[10%] right-[8%] flex items-center gap-1.5 rounded-md border border-base-border bg-base-surface px-2 py-1 shadow-card">
            <MapPin className="h-3 w-3 text-entity-location" /><span className="font-mono text-xs text-ink-500">site</span>
          </div>
          <div className="absolute left-[32%] top-[46%] flex items-center gap-1.5 rounded-md border border-base-border bg-base-surface px-2 py-1 shadow-card">
            <UserRound className="h-3 w-3 text-entity-person" /><span className="font-mono text-xs text-ink-500">subject</span>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="rounded-lg border border-base-border bg-base-muted px-3 py-2.5">
            <p className="font-mono text-xs uppercase tracking-wide text-ink-400">Selected relationship</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">Shared device activity</p>
            <p className="mt-1 text-xs leading-5 text-ink-500">Supported by call records and an entry log from the same time window.</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-base-border bg-base-surface px-3 py-2.5 sm:flex-col sm:items-start sm:justify-center">
            <span className="flex items-center gap-1.5 font-mono text-xs text-ink-500"><span className="h-1.5 w-4 bg-accent" /> observed</span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-ink-500"><span className="h-0 w-4 border-t border-dashed border-entity-phone" /> lead</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-3 hidden rounded-lg border border-base-border bg-base-surface px-3 py-2 shadow-panel sm:block">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-400">Evidence trace</p>
        <p className="mt-1 text-xs font-semibold text-ink-900">Record 08 · call detail</p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const revealInitial = prefersReducedMotion ? false : { opacity: 0, y: 24, filter: 'blur(4px)' }
  const revealTransition = { duration: 0.72, ease: easeOut }

  return (
    <div className="min-h-screen overflow-x-hidden bg-base-bg">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-base-navy px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
        Skip to content
      </a>

      <header className="px-4 pt-4 sm:px-6 sm:pt-6">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-base-border bg-base-surface/95 px-4 py-2.5 shadow-card backdrop-blur" aria-label="Primary navigation">
          <div className="flex items-center gap-2.5" aria-label="LinkTrace home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-navy text-accent-soft"><ShieldCheck className="h-4 w-4" /></span>
            <span className="font-sans text-sm font-semibold tracking-tight text-ink-900">LinkTrace</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-base-muted hover:text-ink-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base-surface"
          >
            Sign in
          </button>
        </nav>
      </header>

      <main id="main-content">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:py-24">
          <motion.div initial={revealInitial} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={revealTransition}>
            <p className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent-dim">Investigative link analysis</p>
            <h1 className="max-w-2xl bg-gradient-to-r from-ink-900 to-ink-500 bg-clip-text text-5xl font-semibold tracking-tight text-transparent text-balance sm:text-6xl">
              Follow every lead back to its evidence.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink-500 text-pretty">
              LinkTrace connects calls, transactions, locations, documents, and observations in one evidence backed case view, so investigative teams can verify the links that matter before briefing a case.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="group inline-flex items-center gap-2 rounded-lg bg-base-navy px-4 py-3 text-base font-semibold text-white shadow-panel transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-base-navy-soft active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base-bg"
              >
                Open the sample workspace <ArrowRight className="h-4 w-4 transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5" />
              </button>
              <span className="flex items-center gap-2 text-sm text-ink-500"><ShieldCheck className="h-4 w-4 text-accent-dim" /> Sample data only</span>
            </div>
            <div className="mt-10 flex items-center gap-3 border-l-2 border-accent pl-3">
              <TimerReset className="h-4 w-4 shrink-0 text-accent-dim" />
              <p className="text-sm leading-5 text-ink-500">Built for the moment a case has too many records and not enough connective tissue.</p>
            </div>
          </motion.div>

          <motion.div initial={prefersReducedMotion ? false : { opacity: 0, y: 24, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ ...revealTransition, delay: prefersReducedMotion ? 0 : 0.12 }}>
            <EvidenceNetworkVisual />
          </motion.div>
        </section>

        <section className="border-y border-base-border bg-base-surface px-6 py-12" aria-label="Evidence first outcomes">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[0.85fr_2.15fr] md:items-center">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent-dim">A defensible view</p>
              <p className="mt-3 text-xl font-semibold tracking-tight text-ink-900">Every useful connection has context.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Observed links', 'Directly supported by a source record'],
                ['Reviewable leads', 'Clearly separated from established facts'],
                ['Source trace', 'Open the evidence behind the relationship'],
              ].map(([label, detail]) => (
                <div key={label} className="border-l border-base-border pl-4 first:border-l-0 first:pl-0 sm:first:border-l-0">
                  <p className="text-sm font-semibold text-ink-900">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-500">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <WordByWordTagline />

        <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24" aria-labelledby="outcomes-heading">
          <motion.div initial={revealInitial} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true, amount: 0.25 }} transition={revealTransition} className="max-w-2xl">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent-dim">Make the case easier to read</p>
            <h2 id="outcomes-heading" className="mt-4 text-3xl font-semibold tracking-tight text-ink-900 text-balance sm:text-4xl">See where the story is solid and where it needs another look.</h2>
          </motion.div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {outcomes.map((outcome, index) => {
              const Icon = outcome.icon
              return (
                <motion.article key={outcome.title} initial={prefersReducedMotion ? false : { opacity: 0, y: 20, filter: 'blur(4px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true, amount: 0.2 }} transition={{ ...revealTransition, delay: prefersReducedMotion ? 0 : index * 0.08 }} className="rounded-xl border border-base-border bg-base-surface p-6 shadow-card">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-bg text-accent-dim"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink-900">{outcome.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink-500">{outcome.description}</p>
                </motion.article>
              )
            })}
          </div>
        </section>

        <section className="bg-base-muted px-6 py-20 sm:py-24" aria-labelledby="workflow-heading">
          <div className="mx-auto max-w-6xl">
            <div className="flex max-w-2xl flex-col gap-4">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent-dim">From record to decision</p>
              <h2 id="workflow-heading" className="text-3xl font-semibold tracking-tight text-ink-900 text-balance sm:text-4xl">A case workspace that respects the investigative sequence.</h2>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {workflow.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.article key={item.step} initial={prefersReducedMotion ? false : { opacity: 0, y: 20, filter: 'blur(4px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true, amount: 0.2 }} transition={{ ...revealTransition, delay: prefersReducedMotion ? 0 : index * 0.08 }} className="rounded-xl border border-base-border bg-base-surface p-6 shadow-card">
                    <div className="flex items-center justify-between"><span className="font-mono text-xs font-medium text-accent-dim">{item.step}</span><Icon className="h-5 w-5 text-ink-400" /></div>
                    <h3 className="mt-10 text-lg font-semibold tracking-tight text-ink-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-ink-500">{item.description}</p>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-20 sm:py-24" aria-labelledby="faq-heading">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent-dim">Questions, answered</p>
            <h2 id="faq-heading" className="mt-4 text-3xl font-semibold tracking-tight text-ink-900 text-balance sm:text-4xl">Understand the workspace before you enter it.</h2>
          </div>
          <div className="mt-10 divide-y divide-base-border border-y border-base-border">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-base font-semibold text-ink-900 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-base-bg">
                  {faq.question}
                  <GitBranch className="h-4 w-4 shrink-0 text-accent-dim transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-open:rotate-90" />
                </summary>
                <p className="max-w-2xl pt-3 text-sm leading-6 text-ink-500">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-6 pb-20 sm:pb-24" aria-labelledby="final-cta-heading">
          <div className="mx-auto max-w-6xl rounded-2xl bg-base-navy px-6 py-12 text-center shadow-panel sm:px-12 sm:py-16">
            <ShieldCheck className="mx-auto h-7 w-7 text-accent-soft" />
            <h2 id="final-cta-heading" className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white text-balance sm:text-4xl">Open the case with the full network in view.</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-ink-inverse/70 text-pretty">Explore the sample workspace with investigator and supervisor views. The prototype uses sample data throughout.</p>
            <button onClick={() => navigate('/login')} className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-3 text-base font-semibold text-base-navy transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-accent-soft active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-base-navy">
              Open the sample workspace <ArrowRight className="h-4 w-4 transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-base-border px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <span>LinkTrace · Investigative link analysis prototype</span>
          <span>SIH 2026 · Problem Statement 189 · Sample data throughout</span>
        </div>
      </footer>
    </div>
  )
}
