import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base
from app.models import Interaction, Item, TruePreference, User  # noqa: F401


@pytest.fixture()
def db_session():
    """Isolated in-memory SQLite session per test -- fast, no MySQL dependency,
    and schema-compatible since the models use only portable column types.
    StaticPool keeps every connection pointed at the same in-memory database,
    which matters here because the API tests exercise this session from a
    FastAPI threadpool worker, not just the test's own thread."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
