import json
from contextlib import asynccontextmanager

import redis
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.candidates import get_candidates
from app.config import settings
from app.db import SessionLocal, get_db
from app.mf import MatrixFactorizer
from app.models import User
from app.ranking import rank_candidates, train_model

model_state: dict[str, MatrixFactorizer] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        model_state["model"] = train_model(db)
    finally:
        db.close()

    app.state.redis = redis.Redis(host=settings.redis_host, port=settings.redis_port, decode_responses=True)
    yield
    model_state.clear()


app = FastAPI(title="RankAPI", lifespan=lifespan)

# Allows the local frontend dev server (Vite, default port 5173) to call the
# API directly from the browser for the live demo panel. Portfolio-scale
# convenience, not a production CORS policy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/recommendations/{user_id}")
def get_recommendations(
    user_id: int,
    k: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if not db.query(User.id).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail=f"user {user_id} not found")

    cache_key = f"recs:{user_id}:{k}"
    cached = app.state.redis.get(cache_key)
    if cached is not None:
        payload = json.loads(cached)
        payload["cache_hit"] = True
        return payload

    candidates = get_candidates(db, user_id)
    if not candidates:
        payload = {"user_id": user_id, "k": k, "items": [], "cache_hit": False}
        return payload

    model = model_state["model"]
    ranked = rank_candidates(model, user_id, candidates, k=k)

    items = [
        {"item_id": item.id, "category": item.category, "score": round(score, 6)}
        for item, score in ranked
    ]
    payload = {"user_id": user_id, "k": k, "items": items, "cache_hit": False}

    app.state.redis.setex(cache_key, settings.cache_ttl_seconds, json.dumps(payload))
    return payload
