export const DEFAULT_MIN_RELEVANCE_SCORE = 20;

export interface ScoredItem {
  path: string;
  score: number;
}

export function filterByRelevance<T extends ScoredItem>(
  items: T[],
  minScore = DEFAULT_MIN_RELEVANCE_SCORE
): T[] {
  return items.filter((item) => item.score >= minScore);
}
