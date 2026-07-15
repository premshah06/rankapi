# RankAPI

A two-stage personalized recommendation ranking service built on **synthetic data with known ground truth**, so ranking quality can be measured objectively instead of assumed.

This is a portfolio project demonstrating backend engineering (Python/FastAPI), data modeling (MySQL), ranking algorithm design (matrix factorization implemented from scratch), and CI/CD. It is **not** a production recommendation system — there is no claim of "production-grade" or "scales to millions of users" anywhere in this repo.

## Why synthetic data

Real interaction datasets have no ground truth: you can measure "did the user click it" but never "did we recommend the right thing for their actual taste," because you don't know their actual taste. Synthetic data fixes that by construction — we generate each user's true preference vector ourselves, then generate noisy, realistic interactions *from* that vector, and finally hide the true vector from the ranking model entirely. The model only ever sees interactions. The [evaluation step](#evaluation-methodology) below then checks the model's output against the hidden ground truth, which is the entire point: it proves whether the ranker recovers actual taste, or just popularity.

If you skip that evaluation step, this justification collapses — you'd just be doing recommendations on fake data for no reason. So Phase 4 (evaluation) is treated as mandatory, not optional, in this build.

## Architecture

```
 [data-gen/generate.py]
          |
          v
 MySQL: users, items, interactions, true_preferences  <-- true_preferences is
          |                                                write-only from here;
          |                                                the ranking service
          v                                                never reads it.
 FastAPI: GET /recommendations/{userId}?k=10
          |
          v
 Candidate generation (retrieval)  --  items the user hasn't
          |                            interacted with, filtered to
          |                            categories they've shown interest in
          v
 Ranking (matrix factorization, from scratch, SGD)
          |
          v
 Redis cache (5 min TTL)
          |
          v
 JSON response
```

Two-stage pipeline, same shape real recommender systems use: **retrieval** is cheap and broad (SQL filter over the whole catalog), **ranking** is precise and expensive (a trained model scoring a much smaller candidate set). Splitting them means the expensive model only ever runs over items that already passed a cheap sanity filter.

## Tech stack

| Layer | Choice |
|---|---|
| API | Python, FastAPI |
| Database | MySQL 8 |
| Caching | Redis |
| Ranking | Matrix factorization, implemented from scratch (plain SGD, no ML library) |
| Data generation | Python script (`data-gen/generate.py`), run once to seed MySQL |
| CI/CD | GitHub Actions |
| Testing | Pytest |
| Containerization | Docker + Docker Compose |

**Honest gap note:** this project does not use Java. The ranking algorithm is matrix factorization trained by stochastic gradient descent — not deep learning, and it is described that way everywhere in this repo and should be described that way in any resume bullet referencing this project.

## Ground truth design

- Each synthetic user gets a **Dirichlet-sampled preference vector** over 8 categories (electronics, books, fashion, home, sports, beauty, toys, grocery), summing to 1. A low Dirichlet alpha (0.6) biases each user toward a small number of favorite categories, which is what makes precision@k against ground truth a meaningful signal rather than noise.
- Each item belongs to one category and has a base popularity score (Beta-distributed, skewed toward lower popularity — a few blockbuster items, a long tail of niche ones).
- Interactions are generated with `interaction_probability = user_preference[item.category] * item.popularity + noise`, then drawn as independent Bernoulli trials per (user, item) pair.
- The **true preference vector** is stored in a separate `true_preferences` table. The candidate-generation and ranking code paths never query it — only `api/app/evaluate.py` does, and only to score the model's output after the fact.

## Evaluation methodology

A category is "relevant" to a user if their true preference weight for it exceeds the uniform baseline (`1 / n_categories`) — i.e. a category they like more than a random user would. For each user, we take the ranker's top-k recommendations and check what fraction land in a relevant category (precision@k), and what fraction of the relevant candidates available to that user got surfaced (recall@k).

This is checked against the **true preference vector**, which the model was never trained on — only against the noisy interactions generated from it. That gap is exactly what makes the number meaningful: a ranker that just learned to replay popularity would not score well here, because popularity and true preference are only loosely correlated by construction (noise term, Beta-distributed popularity independent of any one user's taste).

**Real, reproducible result** (not estimated, not invented):

```
precision@10 = 0.773
recall@10    = 0.255
```

evaluated across all 300 seeded users. Reproduce it yourself:

```bash
cd api
python run_eval.py --k 10
```

## Setup

### Prerequisites
- Docker + Docker Compose
- Python 3.11+ (only needed for running the data generator / eval scripts outside Docker; the API itself runs fully containerized)

### 1. Start MySQL + Redis (+ optionally the API)

```bash
docker compose up -d mysql redis
```

### 2. Seed synthetic data

```bash
cd api
python -m venv ../.venv && source ../.venv/bin/activate
pip install -r requirements.txt
python ../data-gen/generate.py --users 300 --items 150
python ../data-gen/sanity_check.py   # verifies row counts + preference vectors sum to 1
```

### 3. Run the API

Either via Docker:
```bash
docker compose up -d --build api
```
or locally:
```bash
cd api
uvicorn app.main:app --reload
```

### 4. Try it

```bash
curl "http://localhost:8000/recommendations/0?k=5"
```

Call it twice — the second response will have `"cache_hit": true`, served from Redis instead of re-running the ranking model.

### 5. Run the tests

```bash
cd api
pytest tests/ -v
```

### 6. Run the evaluation

```bash
cd api
python run_eval.py --k 10
```

## Project structure

```
data-gen/          synthetic data generator + sanity check
api/
  app/
    constants.py    category list
    config.py       env-driven settings (MySQL/Redis connection, cache TTL)
    db.py           SQLAlchemy engine/session
    models.py       users, items, interactions, true_preferences tables
    candidates.py   retrieval stage
    mf.py           matrix factorization, from scratch
    ranking.py      trains the model, ranks candidates
    evaluate.py      precision@k / recall@k against true_preferences
    main.py         FastAPI app + /recommendations endpoint
  tests/            pytest suite (candidate gen, ranking, API, data generator)
  run_eval.py       Phase 4 checkpoint entry point
  Dockerfile
frontend/           visual walkthrough of the pipeline (see frontend/README.md)
docker-compose.yml
.github/workflows/ci.yml
```

## Interview-defensibility checklist

- [x] Precision@k / Recall@k number is real and reproducible — `precision@10 = 0.773`, `recall@10 = 0.255`, via `python run_eval.py --k 10`
- [x] Ranking algorithm (SGD matrix factorization) is fully implemented in `api/app/mf.py`, no black-box library
- [x] Candidate generation vs. ranking split mirrors real two-stage recommender architecture
- [x] CI pipeline has been shown failing on a bad test, not just passing (see commit history)
- [x] No claim of "deep learning" — this is matrix factorization via SGD, described as such
- [x] Resume bullets should reference Python/FastAPI, not Java — this project does not use Java anywhere
