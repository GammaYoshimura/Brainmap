export type MatchCategory =
  | "brain-doc"
  | "source-file"
  | "test"
  | "subsystem"
  | "dependency"
  | "adr";

export interface RankedItem<T = unknown> {
  path: string;
  category: MatchCategory;
  score: number;
  reasons: string[];
  metadata?: T;
}

export interface CandidateMatchInput {
  path: string;
  category: MatchCategory;
  score: number;
  reason: string;
  metadata?: unknown;
}

export function createRelevanceRanking<T = unknown>(
  inputs: CandidateMatchInput[]
): RankedItem<T>[] {
  if (!inputs || inputs.length === 0) {
    return [];
  }

  // Deduplicate and aggregate matches by path
  const aggregated = new Map<string, RankedItem<T>>();

  for (const input of inputs) {
    const existing = aggregated.get(input.path);
    if (!existing) {
      aggregated.set(input.path, {
        path: input.path,
        category: input.category,
        score: Math.min(100, Math.max(0, input.score)),
        reasons: [input.reason],
        metadata: input.metadata as T,
      });
    } else {
      // If multiple match criteria hit the same item, boost the score
      const bonus = Math.round(input.score * 0.15);
      existing.score = Math.min(100, Math.max(existing.score, input.score) + bonus);
      if (!existing.reasons.includes(input.reason)) {
        existing.reasons.push(input.reason);
      }
      if (input.metadata && !existing.metadata) {
        existing.metadata = input.metadata as T;
      }
    }
  }

  const items = Array.from(aggregated.values());

  return items.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Category priority order
    const categoryOrder: Record<MatchCategory, number> = {
      "brain-doc": 1,
      "source-file": 2,
      "test": 3,
      "adr": 4,
      "subsystem": 5,
      "dependency": 6,
    };
    const catDiff = (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99);
    if (catDiff !== 0) {
      return catDiff;
    }
    return a.path.localeCompare(b.path);
  });
}
