from datetime import datetime, timezone

from app.candidates import get_candidates
from app.models import Interaction, Item, User


def _seed(db, n_items=6):
    db.add(User(id=1))
    categories = ["electronics", "electronics", "books", "books", "fashion", "fashion"]
    for i in range(n_items):
        db.add(Item(id=i, category=categories[i % len(categories)], popularity=0.5))
    db.commit()


def test_candidates_excludes_interacted_items(db_session):
    _seed(db_session)
    db_session.add(
        Interaction(user_id=1, item_id=0, created_at=datetime.now(timezone.utc))
    )
    db_session.commit()

    candidates = get_candidates(db_session, user_id=1)
    candidate_ids = {item.id for item in candidates}

    assert len(candidates) > 0
    assert 0 not in candidate_ids


def test_candidates_nonempty_for_cold_start_user(db_session):
    _seed(db_session)
    db_session.add(User(id=2))
    db_session.commit()

    candidates = get_candidates(db_session, user_id=2)

    assert len(candidates) == 6


def test_candidates_filtered_to_interacted_categories(db_session):
    _seed(db_session)
    db_session.add(
        Interaction(user_id=1, item_id=0, created_at=datetime.now(timezone.utc))
    )
    db_session.commit()

    candidates = get_candidates(db_session, user_id=1)
    categories = {item.category for item in candidates}

    assert categories == {"electronics"}
