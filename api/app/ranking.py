from sqlalchemy.orm import Session

from app.mf import MatrixFactorizer
from app.models import Interaction, Item, User


def train_model(db: Session, **mf_kwargs) -> MatrixFactorizer:
    user_ids = [row[0] for row in db.query(User.id).all()]
    item_ids = [row[0] for row in db.query(Item.id).all()]
    positive_pairs = [
        (row[0], row[1]) for row in db.query(Interaction.user_id, Interaction.item_id).all()
    ]

    model = MatrixFactorizer(**mf_kwargs)
    model.fit(user_ids, item_ids, positive_pairs)
    return model


def rank_candidates(model: MatrixFactorizer, user_id: int, candidates: list[Item], k: int = 10):
    """Returns up to k (Item, score) pairs, highest score first."""
    scored = [(item, model.score(user_id, item.id)) for item in candidates]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:k]
