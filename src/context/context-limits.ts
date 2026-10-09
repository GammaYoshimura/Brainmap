export const DEFAULT_MAX_CONTEXT_CHARACTERS = 50_000;
export const DEFAULT_MAX_FILE_CHARACTERS = 20_000;

export interface ContextSizeBudget {
  maxCharacters?: number;
  maxFiles?: number;
  currentCharacters: number;
  currentFiles: number;
}

export function createContextBudget(
  maxCharacters = DEFAULT_MAX_CONTEXT_CHARACTERS,
  maxFiles?: number
): ContextSizeBudget {
  return {
    maxCharacters,
    maxFiles,
    currentCharacters: 0,
    currentFiles: 0,
  };
}

export function canIncludeInBudget(
  budget: ContextSizeBudget,
  characterCount: number
): boolean {
  if (budget.maxFiles !== undefined && budget.currentFiles >= budget.maxFiles) {
    return false;
  }
  if (
    budget.maxCharacters !== undefined &&
    budget.currentCharacters + characterCount > budget.maxCharacters
  ) {
    return false;
  }
  return true;
}

export function recordInBudget(
  budget: ContextSizeBudget,
  characterCount: number
): void {
  budget.currentCharacters += characterCount;
  budget.currentFiles += 1;
}

export function truncateContentToLimit(
  content: string,
  maxCharacters = DEFAULT_MAX_FILE_CHARACTERS
): { content: string; truncated: boolean } {
  if (content.length <= maxCharacters) {
    return { content, truncated: false };
  }
  return {
    content: content.slice(0, maxCharacters) + "\n... [content truncated to fit size limit]",
    truncated: true,
  };
}
