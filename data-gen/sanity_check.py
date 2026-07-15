"""Phase 1 checkpoint: verify row counts and that each user's true preference
vector sums to 1, directly against MySQL (not the ORM's in-memory state)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api"))

from sqlalchemy import func  # noqa: E402

from app.db import SessionLocal  # noqa: E402
from app.models import Interaction, Item, TruePreference, User  # noqa: E402


def main():
    db = SessionLocal()
    try:
        n_users = db.query(func.count(User.id)).scalar()
        n_items = db.query(func.count(Item.id)).scalar()
        n_interactions = db.query(func.count(Interaction.id)).scalar()

        print(f"users={n_users} items={n_items} interactions={n_interactions}")

        sums = (
            db.query(TruePreference.user_id, func.sum(TruePreference.weight))
            .group_by(TruePreference.user_id)
            .all()
        )
        bad = [(uid, total) for uid, total in sums if abs(total - 1.0) > 1e-6]

        if not sums:
            print("FAIL: no true_preferences rows found")
            sys.exit(1)
        if bad:
            print(f"FAIL: {len(bad)} users have preference vectors that don't sum to 1")
            for uid, total in bad[:5]:
                print(f"  user {uid}: sum={total}")
            sys.exit(1)

        print(f"OK: all {len(sums)} users' preference vectors sum to 1 (within 1e-6)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
