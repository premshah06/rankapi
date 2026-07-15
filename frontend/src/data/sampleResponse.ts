/** Well-labeled static fallback, shaped exactly like the real API response from
 * GET /recommendations/{user_id}?k=10. Used when the local API isn't reachable. */
export const SAMPLE_RESPONSE = {
  user_id: 42,
  k: 10,
  items: [
    { item_id: 87, category: 'electronics', score: 2.108743 },
    { item_id: 12, category: 'electronics', score: 1.87412 },
    { item_id: 63, category: 'electronics', score: 1.552019 },
    { item_id: 29, category: 'sports', score: 1.331587 },
    { item_id: 101, category: 'sports', score: 1.204955 },
    { item_id: 8, category: 'electronics', score: 0.998231 },
    { item_id: 74, category: 'sports', score: 0.887654 },
    { item_id: 132, category: 'electronics', score: 0.771902 },
    { item_id: 45, category: 'sports', score: 0.652088 },
    { item_id: 19, category: 'electronics', score: 0.541773 },
  ],
  cache_hit: false,
}

export const SAMPLE_USER_IDS = [7, 42, 118, 205, 271]
