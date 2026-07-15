"""Computes precision@k / recall@k against the TRUE preference vectors --
never against the (noisy) interactions the model trained on. This is the
step that justifies using synthetic data at all: without it, there's no way
to know whether the ranker recovers actual taste or just replays popularity.

A category is "relevant" to a user if their true preference weight for it
exceeds the uniform baseline (1 / n_categories) -- i.e. it's a category they
like more than a random user would. Recommended items are scored as hits
based on their category being relevant, since the ranking model only ever
sees item categories/interactions, never the true weights themselves.
"""
from statistics import mean

from sqlalchemy.orm import Session

from app.candidates import get_candidates
from app.constants import N_CATEGORIES
from app.mf import MatrixFactorizer
from app.models import TruePreference, User
from app.ranking import rank_candidates


def relevant_categories(true_prefs: dict[str, float]) -> set[str]:
    baseline = 1.0 / N_CATEGORIES
    return {category for category, weight in true_prefs.items() if weight > baseline}


def evaluate(db: Session, model: MatrixFactorizer, k: int = 10) -> dict:
    user_ids = [row[0] for row in db.query(User.id).all()]

    precisions = []
    recalls = []

    for user_id in user_ids:
        candidates = get_candidates(db, user_id)
        if not candidates:
            continue

        true_prefs = {
            tp.category: tp.weight
            for tp in db.query(TruePreference).filter(TruePreference.user_id == user_id).all()
        }
        relevant_cats = relevant_categories(true_prefs)
        if not relevant_cats:
            continue

        ranked = rank_candidates(model, user_id, candidates, k=k)
        if not ranked:
            continue

        recommended_categories = [item.category for item, _score in ranked]
        hits = sum(1 for category in recommended_categories if category in relevant_cats)

        precisions.append(hits / len(ranked))

        relevant_in_candidates = sum(1 for item in candidates if item.category in relevant_cats)
        if relevant_in_candidates > 0:
            recalls.append(hits / relevant_in_candidates)

    return {
        "k": k,
        "n_users_evaluated": len(precisions),
        "precision@k": mean(precisions) if precisions else 0.0,
        "recall@k": mean(recalls) if recalls else 0.0,
    }
