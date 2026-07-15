from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=False)

    interactions = relationship("Interaction", back_populates="user")
    true_preferences = relationship("TruePreference", back_populates="user")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=False)
    category = Column(String(32), nullable=False, index=True)
    popularity = Column(Float, nullable=False)

    interactions = relationship("Interaction", back_populates="item")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="interactions")
    item = relationship("Item", back_populates="interactions")

    __table_args__ = (UniqueConstraint("user_id", "item_id", name="uq_user_item"),)


class TruePreference(Base):
    """Ground-truth preference weight per (user, category). Not read by the ranking
    service — only by the Phase 4 evaluation script, which scores rankings against it."""

    __tablename__ = "true_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String(32), nullable=False)
    weight = Column(Float, nullable=False)

    user = relationship("User", back_populates="true_preferences")

    __table_args__ = (UniqueConstraint("user_id", "category", name="uq_user_category"),)
