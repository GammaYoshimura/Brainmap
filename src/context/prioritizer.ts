import { SelectedBrainDoc } from "./brain-doc-selector.js";
import { SelectedSourceFile } from "./source-code-selector.js";
import {
  ContextSizeBudget,
  canIncludeInBudget,
  recordInBudget,
  truncateContentToLimit,
} from "./context-limits.js";

export type ContextItemType = "brain-doc" | "source-file" | "test";

export interface PrioritizedContextItem {
  type: ContextItemType;
  path: string;
  score: number;
  reasons: string[];
  content: string;
  truncated: boolean;
  characters: number;
}

export function prioritizeContextItems(
  brainDocs: SelectedBrainDoc[],
  sourceFiles: SelectedSourceFile[],
  budget?: ContextSizeBudget
): { items: PrioritizedContextItem[]; omittedCount: number } {
  const candidates: {
    type: ContextItemType;
    path: string;
    score: number;
    reasons: string[];
    content: string;
  }[] = [];

  for (const doc of brainDocs) {
    if (doc.content !== undefined) {
      candidates.push({
        type: "brain-doc",
        path: doc.path,
        score: doc.score,
        reasons: doc.reasons,
        content: doc.content,
      });
    }
  }

  for (const src of sourceFiles) {
    if (src.content !== undefined) {
      candidates.push({
        type: src.isTest ? "test" : "source-file",
        path: src.path,
        score: src.score,
        reasons: src.reasons,
        content: src.content,
      });
    }
  }

  // Type precedence weight for ties: brain-doc (3) > source-file (2) > test (1)
  const typeWeight = (t: ContextItemType): number => {
    switch (t) {
      case "brain-doc":
        return 3;
      case "source-file":
        return 2;
      case "test":
        return 1;
    }
  };

  // Sort by score descending, then typeWeight descending, then path ascending
  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const weightDiff = typeWeight(b.type) - typeWeight(a.type);
    if (weightDiff !== 0) {
      return weightDiff;
    }
    return a.path.localeCompare(b.path);
  });

  const items: PrioritizedContextItem[] = [];
  let omittedCount = 0;

  for (const cand of candidates) {
    const focusTokens: string[] = [];
    for (const r of cand.reasons) {
      if (r.startsWith("symbol match: ")) {
        focusTokens.push(r.slice("symbol match: ".length).trim());
      }
    }

    const { content, truncated } = truncateContentToLimit(cand.content, {
      focusTokens,
      filePath: cand.path,
    });
    const chars = content.length;

    if (budget && !canIncludeInBudget(budget, chars)) {
      omittedCount += 1;
      continue;
    }

    if (budget) {
      recordInBudget(budget, chars);
    }

    items.push({
      type: cand.type,
      path: cand.path,
      score: cand.score,
      reasons: cand.reasons,
      content,
      truncated,
      characters: chars,
    });
  }

  return { items, omittedCount };
}
