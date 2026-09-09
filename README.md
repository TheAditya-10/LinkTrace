# LinkTrace

An AI-styled investigative link-analysis dashboard, built for **Smart India Hackathon 2026 — Problem Statement SIH26189** (Team Dev-Lok).

LinkTrace fuses fragmented crime evidence (FIRs, call records, transactions, surveillance, social media) into a single evidence-weighted network graph, so investigators can see hidden connections between people, assets, and cases — and trace every insight back to its source evidence.

This is primarily a **frontend prototype**: there is no database or persistence layer. All entities, relationships, evidence, alerts, and analytics for the three built-in cases are pre-authored mock data, structured to look and behave like the output of the conceptual pipeline described in the pitch. Interactions (filtering, search, drill-down, graph analytics) are all real and computed client-side. The one exception is **AI Extraction** (see below), which makes a real Gemini call through a single Vercel Edge Function — everything it produces still only lives in the browser session's state, never written to a backend.

## Features

- **Case Selector** — multiple cases with status/risk badges, search & filter.
- **Command Overview** — a supervisor-facing multi-case risk register.
- **Network Relationship Map** — force-directed graph (`d3-force`) with entity-type coloring, weighted/predicted edges, filters, and click-to-explore.
- **Priority Connection Leads** — ranked leads with a "why flagged" reason.
- **Key & Bridge Entities** — degree-ranked hubs and graph-theoretic bridge (articulation point) detection, computed live from the case's relationship graph.
- **Temporal Activity View** — scrubbable timeline with play/pause.
- **Evidence-to-Link Trace** — full evidence chain per relationship, with contradiction flags.
- **Entity Detail Panel** & **Alerts Panel** — global overlays reachable from any view.
- **AI Extraction** (Sparkles icon, top bar) — the one *real* AI feature: paste a raw excerpt and Gemini extracts entities/relationships from it server-side, which you review and merge into the active case. Session-only, not persisted. See [AI Extraction](#ai-extraction-gemini) below.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS (light "forensic command-center" design system)
- Zustand for app state
- React Router
- `d3-force` for graph layout (custom SVG renderer, not a pre-built graph library)
- `lucide-react` for icons
- One Vercel Edge Function (`api/extract-entities.ts`) proxying Gemini — the only server-side code in the app

## Getting started

```bash
npm install
npm run dev
```

Sign in with any non-empty Investigator ID / password (mock auth, no validation beyond non-empty fields).

## Build

```bash
npm run build
npm run preview
```

## Deploying to Vercel

This repo includes a `vercel.json` configured for a static Vite SPA (build command `npm run build`, output `dist`, with an SPA rewrite so client-side routes resolve correctly). Import the repo in Vercel and deploy.

The app itself needs no environment variables to run — everything except AI Extraction is static mock data. Set `GEMINI_API_KEY` (see below) only if you want that one feature to work.

## AI Extraction (Gemini)

Everywhere else in the app, "AI" is pre-authored mock data, by design (see the non-goals below) — that's the whole point of a hackathon prototype. The one exception is the **AI Extraction** panel (Sparkles icon in the top bar): paste a raw excerpt of investigative text and it calls Gemini for real, server-side, to extract entities and relationships, which you can review and merge into the active case's in-memory graph.

**Setup:**
1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. In your Vercel project → **Settings → Environment Variables**, add:
   - Key: `GEMINI_API_KEY`
   - Value: your key
   - Do **not** prefix it with `VITE_` — that would bundle it into the client-side JS and expose it publicly. `GEMINI_API_KEY` is read only inside `api/extract-entities.ts`, a Vercel Edge Function that runs server-side; the browser never sees the key.
3. Redeploy (env var changes need a new deployment to take effect).

Without the key set, every other feature works exactly as before — the AI Extraction panel just shows a clear "server is not configured" message instead of erroring the whole app.

**How it works:** the client POSTs `{ text, sourceType }` to `/api/extract-entities`; the function calls `gemini-2.0-flash` with a constrained JSON schema (entity/relationship types restricted to this app's enums) and a prompt that tells it to extract only what's directly supported by the text, not to invent connections. The response is sanitized server-side, returned to the client for review (each item individually checkable, with the model's own confidence score), and only written into the case's Zustand state once you click "Add to case" — nothing is written until you approve it, and nothing is ever sent to a real database (there isn't one).

**Local testing:** `npm run dev` (plain Vite) does not serve `/api` routes. To exercise the real Gemini call locally, use the [Vercel CLI](https://vercel.com/docs/cli): `vercel dev` with a `.env.local` containing `GEMINI_API_KEY=...`.

## Project structure

```
api/
  extract-entities.ts   Vercel Edge Function — the only server-side code, proxies Gemini
src/
  types/        Data model types (Entity, Relationship, Evidence, Case, ...)
  data/cases/   Mock case fixtures (3 fully-worked cases)
  lib/          Mock API layer, graph analytics (degree/bridge/cluster), extraction client, utils
  store/        Zustand app store (auth, active case, filters, selection, AI-merge)
  components/   Shared UI, layout shell, graph renderer, AI Extraction panel
  pages/        Routed views
```
