# RankAPI — Project Board

Sprint-style breakdown of the build, phase by phase. Each phase has a checkpoint that had to pass before moving to the next — this board reflects the actual order things were built and verified in, not a retrofit.

## Sprint 1 — Foundation

### Phase 0: Scaffolding
- [x] Repo structure (`data-gen/`, `api/`, `api/tests/`, `.github/workflows/`)
- [x] `docker-compose.yml` for MySQL + Redis
- **Checkpoint:** `docker compose up -d mysql redis` — both containers reach `healthy` status. ✅ Verified.

### Phase 1: Synthetic data generation
- [x] `data-gen/generate.py` — configurable N users, M items, Dirichlet-sampled category preference vectors
- [x] Interactions generated via `interaction_probability = user_preference[item.category] * item.popularity + noise`
- [x] True preference vectors stored in a separate `true_preferences` table, never queried by the ranking path
- **Checkpoint:** `data-gen/sanity_check.py` confirms row counts and that every user's preference vector sums to 1. ✅ Verified — 300 users, 150 items, 6,781 interactions.

## Sprint 2 — Core ranking pipeline

### Phase 2: Candidate generation (retrieval stage)
- [x] `api/app/candidates.py` — items the user hasn't interacted with, filtered to categories they've shown interest in
- **Checkpoint:** unit tests confirm non-empty candidate set and exclusion of already-interacted items (`api/tests/test_candidates.py`). ✅ 3/3 passing.

### Phase 3: Ranking stage
- [x] `api/app/mf.py` — matrix factorization from scratch: implicit-feedback SGD, binary cross-entropy loss, hand-written gradient updates, no ML library
- [x] `api/app/ranking.py` — trains the model against current MySQL interactions, ranks candidates
- **Checkpoint:** synthetic two-cluster test (`api/tests/test_ranking.py`) confirms a user known to prefer category A ranks held-out A items above B items. ✅ Passing.

### Phase 4: Evaluation
- [x] `api/app/evaluate.py` — precision@k / recall@k against `true_preferences`, not interactions
- [x] `api/run_eval.py` — runnable entry point, prints aggregate metrics as JSON
- **Checkpoint:** real, reproducible metric from actual execution — **precision@10 = 0.773, recall@10 = 0.255**, 300/300 users evaluated. Command: `python run_eval.py --k 10` (from `api/`). ✅ Verified, not estimated.

## Sprint 3 — Service layer

### Phase 5: API layer
- [x] `GET /recommendations/{userId}?k=10` — FastAPI, returns ranked items as JSON
- [x] Redis caching, 5-minute TTL
- [x] Error handling: 404 on invalid userId, empty `items: []` on empty candidate set
- **Checkpoint:** curl'd a real seeded user, got valid JSON with k items; second call returned `"cache_hit": true`, confirmed against a Redis `KEYS` check. ✅ Verified.

### Phase 6: Testing
- [x] Pytest: candidate generation, ranking, API endpoint (happy path + 404 + empty candidates + cache hit), data generator (preference vector validity, interaction count bounds)
- **Checkpoint:** `pytest tests/ -v` — 9/9 passing. ✅ Verified.

## Sprint 4 — Delivery

### Phase 7: CI/CD
- [x] `.github/workflows/ci.yml` — runs pytest on push/PR, fails the build on test failure; optional Docker build job gated on tests passing
- **Checkpoint:** pushed a real commit, confirmed a green Actions run; pushed a deliberately broken test, confirmed a red run; reverted, confirmed green again. See commit history and Actions tab for the actual runs.

### Phase 8: Documentation
- [x] `README.md` — architecture, setup, eval methodology, honest gap notes
- [x] `PROJECT_BOARD.md` — this file
- [x] `frontend/` — visual walkthrough of the pipeline for non-technical/interview review
- **Checkpoint:** a person with no prior context can clone the repo and get it running from `README.md` alone.

## Backlog / explicitly out of scope

These were considered and deliberately not built, to keep the project honestly scoped:

- No pretrained recommender library (surprise, implicit, LightFM, etc.) — matrix factorization is hand-implemented so it's explainable line-by-line
- No deep learning ranker — would require retracting the "matrix factorization" framing and isn't necessary to demonstrate the two-stage architecture
- No claim of horizontal scalability / production readiness — this is a portfolio-scale system (hundreds of users, low thousands of items), and is described that way everywhere
- No Java — not part of this stack; do not let this project imply Java experience on a resume
