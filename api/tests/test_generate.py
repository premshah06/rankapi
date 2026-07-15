import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "data-gen"))

from generate import generate  # noqa: E402

from app.db import SessionLocal, engine  # noqa: E402
from app.models import Interaction, Item, TruePreference, User  # noqa: E402


def test_generate_produces_valid_preference_vectors_and_reasonable_interaction_counts(monkeypatch):
    # Point the shared engine at a throwaway file-backed SQLite DB so this
    # test doesn't touch the real MySQL instance, and so create_all/drop_all
    # (which generate() calls) work identically to production.
    from sqlalchemy import create_engine
    import app.db as db_module

    test_engine = create_engine("sqlite:////tmp/rankapi_test_generate.db")
    monkeypatch.setattr(db_module, "engine", test_engine)
    monkeypatch.setattr(
        db_module, "SessionLocal",
        db_module.sessionmaker(autocommit=False, autoflush=False, bind=test_engine),
    )
    import generate as generate_module
    monkeypatch.setattr(generate_module, "engine", test_engine)
    monkeypatch.setattr(generate_module, "SessionLocal", db_module.SessionLocal)

    n_users, n_items = 40, 25
    generate(n_users=n_users, n_items=n_items, seed=7, noise_sigma=0.05, interaction_scale=3.0)

    db = db_module.SessionLocal()
    try:
        assert db.query(User).count() == n_users
        assert db.query(Item).count() == n_items

        n_interactions = db.query(Interaction).count()
        assert 0 < n_interactions < n_users * n_items

        prefs_by_user = {}
        for tp in db.query(TruePreference).all():
            prefs_by_user.setdefault(tp.user_id, 0.0)
            prefs_by_user[tp.user_id] += tp.weight

        assert len(prefs_by_user) == n_users
        for total in prefs_by_user.values():
            assert np.isclose(total, 1.0, atol=1e-6)
    finally:
        db.close()
