export const CATEGORIES = [
  'electronics',
  'books',
  'fashion',
  'home',
  'sports',
  'beauty',
  'toys',
  'grocery',
] as const

export const METRICS = {
  precisionAt10: 0.773,
  recallAt10: 0.255,
  k: 10,
  usersEvaluated: 300,
  seededUsers: 300,
  seededItems: 150,
  seededInteractions: 6781,
  categories: 8,
}

export const MF_HYPERPARAMS = {
  n_factors: 16,
  learning_rate: 0.05,
  reg: 0.02,
  epochs: 20,
  neg_ratio: 4,
  seed: 42,
}

export type Stage = {
  index: string
  accent: 'indigo' | 'sky' | 'orange' | 'emerald'
  eyebrow: string
  title: string
  file: string
  summary: string
  details: string[]
  code?: string
}

export const STAGES: Stage[] = [
  {
    index: '01',
    accent: 'indigo',
    eyebrow: 'Ground truth, by construction',
    title: 'Synthetic data generation',
    file: 'data-gen/generate.py',
    summary:
      'Every user, item, and interaction is generated with a known, controllable preference signal — so ranking quality can be measured objectively instead of guessed at.',
    details: [
      'Each of 300 users gets a Dirichlet-sampled preference vector over 8 categories (alpha = 0.6, biasing users toward a handful of favorite categories — the thing that makes precision@k against ground truth meaningful).',
      'Each of 150 items belongs to one category and gets a popularity score drawn from a Beta(2, 3) distribution, skewed toward lower popularity.',
      'interaction_probability = user_preference[item.category] × item.popularity × 3.0 + noise(σ=0.05), clipped to [0, 1] — this produced 6,781 seeded interactions.',
      'The true preference vectors are written to a separate true_preferences table that the ranking service never queries. Only the evaluation step reads it.',
    ],
    code: `user_prefs = rng.dirichlet(alpha=np.full(8, 0.6), size=n_users)
raw_prob = user_prefs[u][item_categories] * item_popularity * 3.0
prob = np.clip(raw_prob + noise, 0.0, 1.0)
draws = rng.random(n_items) < prob`,
  },
  {
    index: '02',
    accent: 'sky',
    eyebrow: 'Cheap and broad',
    title: 'Candidate generation (retrieval)',
    file: 'api/app/candidates.py',
    summary:
      'Before anything gets scored, the candidate set is narrowed down with simple, fast filters — no model, no learned weights. Retrieval is deliberately dumb so it can be cheap at scale.',
    details: [
      'Pulls every item the user has not already interacted with.',
      'Filters down to categories the user has shown interest in — inferred purely from their interaction history.',
      'Cold-start users with no interaction history fall back to the full item catalog, so they still get a candidate set to rank.',
      'Deliberately does not look at true_preferences — only at what the model is actually allowed to see.',
    ],
    code: `query = db.query(Item)
if interacted_item_ids:
    query = query.filter(~Item.id.in_(interacted_item_ids))
if interacted_categories:
    query = query.filter(Item.category.in_(interacted_categories))`,
  },
  {
    index: '03',
    accent: 'orange',
    eyebrow: 'From scratch, no library',
    title: 'Ranking — matrix factorization via SGD',
    file: 'api/app/mf.py · api/app/ranking.py',
    summary:
      'Candidates are scored by a matrix factorization model implemented from scratch — no PyTorch, no TensorFlow, no surprise/implicit library. Plain SGD with a hand-derived gradient.',
    details: [
      'Learns a latent factor vector + bias per user and per item from implicit feedback: observed interactions are positive examples (label = 1), and for each positive, 4 sampled non-interacted items are negatives (label = 0).',
      'Predicts p(interact) = sigmoid(global_bias + user_bias[u] + item_bias[i] + user_vec[u] · item_vec[i]).',
      'Minimizes binary cross-entropy with L2 regularization, one example at a time — the gradient update for each factor is derived and coded by hand, not delegated to autograd.',
      'Trained with 16 latent factors, learning rate 0.05, regularization 0.02, over 20 epochs, negative ratio 4:1.',
      'Candidates from stage 2 are scored and sorted by this logit, highest first — that ordering is the final ranking.',
    ],
    code: `pred = sigmoid(global_bias + user_bias[u] + item_bias[i]
               + user_factors[u] @ item_factors[i])
error = label - pred
user_factors[u] += lr * (error * item_vec - reg * user_vec)
item_factors[i] += lr * (error * user_vec - reg * item_vec)`,
  },
  {
    index: '04',
    accent: 'emerald',
    eyebrow: 'The step that justifies the whole approach',
    title: 'Evaluation against true preferences',
    file: 'api/app/evaluate.py · api/run_eval.py',
    summary:
      'Precision and recall are computed against the TRUE preference vectors — never against the noisy interactions the model trained on. That distinction is the entire point of using synthetic data.',
    details: [
      'A category counts as "relevant" to a user when their true preference weight for it exceeds the uniform baseline (1/8) — i.e. a category they like more than a random user would.',
      'A recommended item is scored as a hit if its category is relevant, since the ranking model only ever sees item categories and interactions, never the hidden true weights.',
      'Run via python run_eval.py --k 10 from api/, trained on whatever interactions are currently seeded, evaluated across every seeded user.',
      'Result: precision@10 = 0.773, recall@10 = 0.255, evaluated across all 300 seeded users. This is a real, reproducible number from actual code execution — not an estimate.',
    ],
    code: `$ python run_eval.py --k 10
{
  "k": 10,
  "n_users_evaluated": 300,
  "precision@k": 0.773,
  "recall@k": 0.255
}`,
  },
  {
    index: '05',
    accent: 'indigo',
    eyebrow: 'Serving the ranking',
    title: 'API layer',
    file: 'api/app/main.py',
    summary:
      'A FastAPI service exposes the trained ranker over HTTP, with Redis caching so repeat requests for the same user don\'t re-score candidates.',
    details: [
      'GET /recommendations/{user_id}?k=10 runs candidate generation → ranking → returns the top-k items as JSON, each with its item_id, category, and raw model score.',
      'The matrix factorization model is trained once at startup (FastAPI lifespan) and held in memory — no retraining per request.',
      'Results are cached in Redis under recs:{user_id}:{k} with a 5-minute TTL (300s). A second call for the same user + k is served straight from cache — the response includes cache_hit: true.',
      'Unknown user IDs return a 404 rather than a silently empty response.',
    ],
    code: `GET /recommendations/42?k=10

{
  "user_id": 42,
  "k": 10,
  "items": [
    { "item_id": 87, "category": "electronics", "score": 2.108743 },
    { "item_id": 12, "category": "electronics", "score": 1.874120 }
  ],
  "cache_hit": false
}`,
  },
]
