from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app, model_state
from app.mf import MatrixFactorizer
from app.models import Item, User


class FakeRedis:
    """In-memory stand-in for the real Redis client so API tests don't need a
    live Redis instance -- Redis's own get/setex contract is trivial enough
    that this is a faithful substitute for testing our caching logic."""

    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def setex(self, key, _ttl, value):
        self.store[key] = value


def _seed(db, n_items=5):
    db.add(User(id=1))
    for i in range(n_items):
        db.add(Item(id=i, category="books", popularity=0.5))
    db.commit()


def _client_with(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    app.state.redis = FakeRedis()
    return TestClient(app)


def test_recommendations_happy_path(db_session):
    _seed(db_session)
    model = MatrixFactorizer(n_factors=4, epochs=1)
    model.fit([1], list(range(5)), [])
    model_state["model"] = model

    client = _client_with(db_session)
    response = client.get("/recommendations/1?k=3")

    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == 1
    assert len(body["items"]) == 3
    assert body["cache_hit"] is False

    app.dependency_overrides.clear()


def test_recommendations_second_call_is_cached(db_session):
    _seed(db_session)
    model = MatrixFactorizer(n_factors=4, epochs=1)
    model.fit([1], list(range(5)), [])
    model_state["model"] = model

    client = _client_with(db_session)
    client.get("/recommendations/1?k=3")
    second = client.get("/recommendations/1?k=3")

    assert second.json()["cache_hit"] is True

    app.dependency_overrides.clear()


def test_recommendations_invalid_user_returns_404(db_session):
    _seed(db_session)
    model = MatrixFactorizer(n_factors=4, epochs=1)
    model.fit([1], list(range(5)), [])
    model_state["model"] = model

    client = _client_with(db_session)
    response = client.get("/recommendations/9999?k=3")

    assert response.status_code == 404

    app.dependency_overrides.clear()


def test_recommendations_empty_candidate_set_returns_empty_list(db_session):
    db_session.add(User(id=1))
    db_session.commit()
    model = MatrixFactorizer(n_factors=4, epochs=1)
    model.fit([1], [], [])
    model_state["model"] = model

    client = _client_with(db_session)
    response = client.get("/recommendations/1?k=3")

    assert response.status_code == 200
    assert response.json()["items"] == []

    app.dependency_overrides.clear()
