"""From-scratch implicit-feedback matrix factorization -- no recommender
library involved, so every update rule here is the actual algorithm, not a
call into a black box.

For each observed interaction (u, i) we treat label=1; for `neg_ratio`
sampled item-per-positive that the user did NOT interact with, we treat
label=0. We predict

    p(u interacts with i) = sigmoid(global_bias + user_bias[u] + item_bias[i]
                                     + user_factors[u] . item_factors[i])

and minimize binary cross-entropy with L2 regularization via plain SGD
(one example at a time, gradient derived by hand below).
"""
import numpy as np


class MatrixFactorizer:
    def __init__(self, n_factors=16, learning_rate=0.05, reg=0.02, epochs=20, neg_ratio=4, seed=42):
        self.n_factors = n_factors
        self.learning_rate = learning_rate
        self.reg = reg
        self.epochs = epochs
        self.neg_ratio = neg_ratio
        self.rng = np.random.default_rng(seed)

        self.user_id_to_idx: dict[int, int] = {}
        self.item_id_to_idx: dict[int, int] = {}
        self.user_factors: np.ndarray | None = None
        self.item_factors: np.ndarray | None = None
        self.user_bias: np.ndarray | None = None
        self.item_bias: np.ndarray | None = None
        self.global_bias = 0.0

    def fit(self, user_ids, item_ids, positive_pairs):
        self.user_id_to_idx = {uid: idx for idx, uid in enumerate(sorted(set(user_ids)))}
        self.item_id_to_idx = {iid: idx for idx, iid in enumerate(sorted(set(item_ids)))}
        n_users = len(self.user_id_to_idx)
        n_items = len(self.item_id_to_idx)

        self.user_factors = self.rng.normal(0, 0.1, size=(n_users, self.n_factors))
        self.item_factors = self.rng.normal(0, 0.1, size=(n_items, self.n_factors))
        self.user_bias = np.zeros(n_users)
        self.item_bias = np.zeros(n_items)
        self.global_bias = 0.0

        pos_pairs = [(self.user_id_to_idx[u], self.item_id_to_idx[i]) for u, i in positive_pairs]

        user_positive_items: dict[int, set] = {}
        for u_idx, i_idx in pos_pairs:
            user_positive_items.setdefault(u_idx, set()).add(i_idx)

        all_item_idx = np.arange(n_items)

        for _epoch in range(self.epochs):
            self.rng.shuffle(pos_pairs)
            for u_idx, i_idx in pos_pairs:
                self._sgd_step(u_idx, i_idx, label=1.0)
                for neg_i_idx in self._sample_negatives(user_positive_items.get(u_idx, set()), all_item_idx):
                    self._sgd_step(u_idx, neg_i_idx, label=0.0)

        return self

    def _sample_negatives(self, positive_set, all_item_idx):
        negatives = []
        attempts = 0
        max_attempts = self.neg_ratio * 10
        while len(negatives) < self.neg_ratio and attempts < max_attempts:
            candidate = int(self.rng.choice(all_item_idx))
            attempts += 1
            if candidate not in positive_set:
                negatives.append(candidate)
        return negatives

    def _predict_logit(self, u_idx, i_idx):
        return (
            self.global_bias
            + self.user_bias[u_idx]
            + self.item_bias[i_idx]
            + float(self.user_factors[u_idx] @ self.item_factors[i_idx])
        )

    def _sgd_step(self, u_idx, i_idx, label):
        pred = 1.0 / (1.0 + np.exp(-self._predict_logit(u_idx, i_idx)))
        error = label - pred  # d(loss)/d(logit) for binary cross-entropy with sigmoid

        u_vec = self.user_factors[u_idx].copy()
        i_vec = self.item_factors[i_idx].copy()

        self.user_factors[u_idx] += self.learning_rate * (error * i_vec - self.reg * u_vec)
        self.item_factors[i_idx] += self.learning_rate * (error * u_vec - self.reg * i_vec)
        self.user_bias[u_idx] += self.learning_rate * (error - self.reg * self.user_bias[u_idx])
        self.item_bias[i_idx] += self.learning_rate * (error - self.reg * self.item_bias[i_idx])
        self.global_bias += self.learning_rate * error

    def score(self, user_id, item_id) -> float:
        u_idx = self.user_id_to_idx.get(user_id)
        i_idx = self.item_id_to_idx.get(item_id)
        if u_idx is None or i_idx is None:
            return self.global_bias
        return self._predict_logit(u_idx, i_idx)
