# LinkTrace

An AI-styled investigative link-analysis dashboard, built for **Smart India Hackathon 2026 — Problem Statement SIH26189** (Team Dev-Lok).

LinkTrace fuses fragmented crime evidence (FIRs, call records, transactions, surveillance, social media) into a single evidence-weighted network graph, so investigators can see hidden connections between people, assets, and cases — and trace every insight back to its source evidence.

This is a **frontend-only prototype**: there is no backend, database, or real NLP/ML pipeline. All entities, relationships, evidence, alerts, and analytics are pre-authored mock data shipped with the app, structured to look and behave like the output of the conceptual pipeline described in the pitch. Interactions (filtering, search, drill-down, graph analytics) are all real and computed client-side.

## Features

- **Case Selector** — multiple cases with status/risk badges, search & filter.
- **Command Overview** — a supervisor-facing multi-case risk register.
- **Network Relationship Map** — force-directed graph (`d3-force`) with entity-type coloring, weighted/predicted edges, filters, and click-to-explore.
- **Priority Connection Leads** — ranked leads with a "why flagged" reason.
- **Key & Bridge Entities** — degree-ranked hubs and graph-theoretic bridge (articulation point) detection, computed live from the case's relationship graph.
- **Temporal Activity View** — scrubbable timeline with play/pause.
- **Evidence-to-Link Trace** — full evidence chain per relationship, with contradiction flags.
- **Entity Detail Panel** & **Alerts Panel** — global overlays reachable from any view.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS (light "forensic command-center" design system)
- Zustand for app state
- React Router
- `d3-force` for graph layout (custom SVG renderer, not a pre-built graph library)
- `lucide-react` for icons

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

This repo includes a `vercel.json` configured for a static Vite SPA (build command `npm run build`, output `dist`, with an SPA rewrite so client-side routes resolve correctly). Import the repo in Vercel and deploy — no environment variables are required.

## Project structure

```
src/
  types/        Data model types (Entity, Relationship, Evidence, Case, ...)
  data/cases/   Mock case fixtures (3 fully-worked cases)
  lib/          Mock API layer, graph analytics (degree/bridge/cluster), utils
  store/        Zustand app store (auth, active case, filters, selection)
  components/   Shared UI, layout shell, graph renderer
  pages/        Routed views
```
