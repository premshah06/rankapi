"""Retrieval stage: cheap filtering down to a candidate set before ranking.

Deliberately does not look at true_preferences -- only at what the model is
actually allowed to see (items and interaction history).
"""
from sqlalchemy.orm import Session

from app.models import Interaction, Item


def get_candidates(db: Session, user_id: int) -> list[Item]:
    interacted_item_ids = {
        row[0]
        for row in db.query(Interaction.item_id).filter(Interaction.user_id == user_id).all()
    }

    interacted_categories = set()
    if interacted_item_ids:
        interacted_categories = {
            row[0]
            for row in db.query(Item.category).filter(Item.id.in_(interacted_item_ids)).distinct().all()
        }

    query = db.query(Item)
    if interacted_item_ids:
        query = query.filter(~Item.id.in_(interacted_item_ids))
    if interacted_categories:
        query = query.filter(Item.category.in_(interacted_categories))

    return query.all()
