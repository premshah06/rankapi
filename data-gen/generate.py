"""Generates synthetic users, items, interactions, and true preference vectors
with a known, controllable ground-truth preference signal, then seeds MySQL.

Ground truth design (see README for full rationale):
  - each user gets a Dirichlet-sampled preference vector over CATEGORIES (sums to 1)
  - each item belongs to one category and has a base popularity score
  - interaction_probability = user_preference[item.category] * item.popularity + noise
  - the true preference vector is stored in `true_preferences`, a table the
    ranking service never queries -- only the Phase 4 eval script reads it,
    so precision/recall can be measured against ground truth, not just
    the (noisy) interactions the model was trained on.
"""
import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api"))

from app.constants import CATEGORIES  # noqa: E402
from app.db import Base, SessionLocal, engine  # noqa: E402
from app.models import Interaction, Item, TruePreference, User  # noqa: E402


def generate(n_users: int, n_items: int, seed: int, noise_sigma: float, interaction_scale: float):
    rng = np.random.default_rng(seed)
    n_categories = len(CATEGORIES)

    # Dirichlet alpha < 1 biases each user toward a small number of favorite
    # categories, which is what makes precision@k against ground truth meaningful.
    user_prefs = rng.dirichlet(alpha=np.full(n_categories, 0.6), size=n_users)

    item_categories = rng.integers(0, n_categories, size=n_items)
    item_popularity = rng.beta(a=2.0, b=3.0, size=n_items)  # skewed toward lower popularity

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        users = [User(id=i) for i in range(n_users)]
        db.add_all(users)

        items = [
            Item(id=j, category=CATEGORIES[item_categories[j]], popularity=float(item_popularity[j]))
            for j in range(n_items)
        ]
        db.add_all(items)

        true_prefs = [
            TruePreference(user_id=u, category=CATEGORIES[c], weight=float(user_prefs[u][c]))
            for u in range(n_users)
            for c in range(n_categories)
        ]
        db.add_all(true_prefs)
        db.commit()

        base_time = datetime.now(timezone.utc) - timedelta(days=90)
        interactions = []
        for u in range(n_users):
            noise = rng.normal(0, noise_sigma, size=n_items)
            raw_prob = user_prefs[u][item_categories] * item_popularity * interaction_scale
            prob = np.clip(raw_prob + noise, 0.0, 1.0)
            draws = rng.random(n_items) < prob
            for j in np.nonzero(draws)[0]:
                interactions.append(
                    Interaction(
                        user_id=u,
                        item_id=int(j),
                        created_at=base_time + timedelta(minutes=int(rng.integers(0, 90 * 24 * 60))),
                    )
                )
        db.add_all(interactions)
        db.commit()

        print(f"seeded {n_users} users, {n_items} items, {len(interactions)} interactions, "
              f"{len(true_prefs)} true-preference rows")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic RankAPI data and seed MySQL")
    parser.add_argument("--users", type=int, default=300)
    parser.add_argument("--items", type=int, default=150)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--noise-sigma", type=float, default=0.05)
    parser.add_argument("--interaction-scale", type=float, default=3.0,
                         help="scales raw_prob up before clipping, since preference*popularity "
                              "alone is usually too small to produce a usable interaction density")
    args = parser.parse_args()

    generate(args.users, args.items, args.seed, args.noise_sigma, args.interaction_scale)


if __name__ == "__main__":
    main()
