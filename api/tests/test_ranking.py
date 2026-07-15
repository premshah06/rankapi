from datetime import datetime, timedelta, timezone

from app.models import Interaction, Item, User
from app.ranking import rank_candidates, train_model


def _seed_category_signal(db):
    """20 users, 20 items split evenly across category A and category B.
    Users 0-9 are 'A-lovers' (user 0 is our test subject), users 10-19 are
    'B-lovers'. This gives matrix factorization actual collaborative signal:
    A items co-occur across the A-loving cluster, so held-out A items end up
    close to user 0's learned vector -- there'd be no such structure to learn
    if only user 0 cared about category A."""
    for uid in range(20):
        db.add(User(id=uid))
    for iid in range(20):
        category = "A" if iid < 10 else "B"
        db.add(Item(id=iid, category=category, popularity=0.5))
    db.commit()

    now = datetime.now(timezone.utc)
    interactions = []

    # User 0 (test subject): only interacts with A items 0-4, leaving 5-9 held out.
    for iid in range(5):
        interactions.append(Interaction(user_id=0, item_id=iid, created_at=now))

    # Users 1-9: also A-lovers, interact with all of items 0-9 (category A).
    for uid in range(1, 10):
        for iid in range(10):
            interactions.append(Interaction(user_id=uid, item_id=iid, created_at=now - timedelta(days=1)))

    # Users 10-19: B-lovers, interact with all of items 10-19 (category B).
    for uid in range(10, 20):
        for iid in range(10, 20):
            interactions.append(Interaction(user_id=uid, item_id=iid, created_at=now - timedelta(days=1)))

    db.add_all(interactions)
    db.commit()


def test_ranking_prefers_users_known_category(db_session):
    """Tests the ranking stage in isolation: candidates are a hand-built mix
    of held-out A and B items (bypassing the candidate generator's own
    category filter, which is covered separately in test_candidates.py)."""
    _seed_category_signal(db_session)

    model = train_model(db_session, n_factors=8, epochs=40, neg_ratio=4, seed=1)

    held_out_items = db_session.query(Item).filter(Item.id.in_(list(range(5, 10)) + list(range(10, 20)))).all()

    ranked = rank_candidates(model, user_id=0, candidates=held_out_items, k=len(held_out_items))
    ranked_categories = [item.category for item, _score in ranked]

    top_half = ranked_categories[: len(ranked_categories) // 2]
    assert top_half.count("A") > top_half.count("B")
    assert ranked_categories[0] == "A"
