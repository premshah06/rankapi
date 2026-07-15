# RankAPI — Frontend

A single scroll-driven page that explains RankAPI's two-stage ranking pipeline
(synthetic data generation → candidate retrieval → matrix factorization ranking →
evaluation against true preference vectors → FastAPI serving layer) and displays
the real precision@10 / recall@10 numbers produced by `api/run_eval.py`.

## Stack

Vite + React + TypeScript, Tailwind CSS, Framer Motion, GSAP + ScrollTrigger,
Lenis smooth scroll, Zustand (scroll-driven accent color state). No content,
copy, or numbers in this UI are placeholders — they're pulled from the actual
pipeline code in `../api` and `../data-gen`, mirrored in `src/data/pipeline.ts`.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Opens on http://localhost:5173.

The "See it respond" demo panel tries `GET http://localhost:8000/recommendations/{user_id}?k=10`
first (i.e. the real API, if you have it running via `docker compose up` or
`uvicorn app.main:app` from `../api`). If that's not reachable within ~2.5s, it
falls back to a clearly labeled static example shaped exactly like a real
response — the whole build never blocks on a live backend connection.

## Build

```bash
npm run build   # tsc -b && vite build, output in dist/
npm run preview # serve the production build locally
```
