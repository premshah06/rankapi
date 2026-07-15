"""Phase 4 checkpoint entry point.

Run with:  python run_eval.py [--k 10]

Trains the matrix factorization model on whatever interactions are currently
seeded in MySQL, then scores its recommendations against the true preference
vectors (which the model never sees). Prints the aggregate precision@k /
recall@k -- this is the real, reproducible number referenced in the README
and any resume bullet, not an estimate.
"""
import argparse
import json

from app.db import SessionLocal
from app.evaluate import evaluate
from app.ranking import train_model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--k", type=int, default=10)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        model = train_model(db)
        results = evaluate(db, model, k=args.k)
        print(json.dumps(results, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
