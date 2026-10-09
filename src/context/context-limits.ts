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

export interface TruncationOptions {
  maxCharacters?: number;
  focusTokens?: string[];
  filePath?: string;
}

/**
 * Truncates content to stay within character limits.
 * When focusTokens are provided, centers the excerpt around the first matching symbol/token
 * instead of discarding relevant trailing code. Always respects maxCharacters including markers.
 */
export function truncateContentToLimit(
  content: string,
  optionsOrMaxChars: number | TruncationOptions = DEFAULT_MAX_FILE_CHARACTERS
): { content: string; truncated: boolean } {
  const maxCharacters = typeof optionsOrMaxChars === "number"
    ? optionsOrMaxChars
    : optionsOrMaxChars.maxCharacters ?? DEFAULT_MAX_FILE_CHARACTERS;

  const focusTokens = typeof optionsOrMaxChars === "object"
    ? optionsOrMaxChars.focusTokens ?? []
    : [];

  const filePath = typeof optionsOrMaxChars === "object"
    ? optionsOrMaxChars.filePath
    : undefined;

  if (content.length <= maxCharacters) {
    return { content, truncated: false };
  }

  const lines = content.split(/\r?\n/);
  const totalLines = lines.length;

  // Search for the first focus token match in content
  let matchIndex = -1;
  let matchedToken: string | undefined;

  for (const token of focusTokens) {
    if (token && token.length >= 2) {
      const idx = content.indexOf(token);
      if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) {
        matchIndex = idx;
        matchedToken = token;
      }
    }
  }

  if (matchIndex !== -1 && matchedToken) {
    // Reserve room for omission markers
    const markerReserve = Math.min(120, Math.floor(maxCharacters * 0.3));
    const budgetForText = Math.max(20, maxCharacters - markerReserve);

    let startChar = Math.max(0, matchIndex - Math.floor(budgetForText / 2));
    let endChar = Math.min(content.length, startChar + budgetForText);

    if (endChar === content.length) {
      startChar = Math.max(0, endChar - budgetForText);
    }

    const prevNewline = content.lastIndexOf("\n", startChar);
    if (prevNewline !== -1 && prevNewline < matchIndex) {
      startChar = prevNewline + 1;
    }

    const nextNewline = content.indexOf("\n", endChar);
    if (nextNewline !== -1 && nextNewline < content.length) {
      endChar = nextNewline;
    }

    const startLine = content.slice(0, startChar).split(/\r?\n/).length;
    const excerptLines = content.slice(startChar, endChar).split(/\r?\n/);
    const endLine = startLine + excerptLines.length - 1;

    let prefixMarker = "";
    if (startChar > 0) {
      prefixMarker = `[... ${filePath ? filePath + ": " : ""}lines 1-${startLine - 1} omitted ...]\n`;
    }

    let suffixMarker = "";
    if (endChar < content.length) {
      suffixMarker = `\n[... ${filePath ? filePath + ": " : ""}lines ${endLine + 1}-${totalLines} omitted ...]`;
    }

    const markersLen = prefixMarker.length + suffixMarker.length;
    const availableForExcerpt = Math.max(0, maxCharacters - markersLen);

    let excerpt = content.slice(startChar, endChar);
    if (excerpt.length > availableForExcerpt) {
      const matchOffset = matchIndex - startChar;
      const startInExcerpt = Math.max(0, matchOffset - Math.floor(availableForExcerpt / 2));
      excerpt = excerpt.slice(startInExcerpt, startInExcerpt + availableForExcerpt);
    }

    const combined = prefixMarker + excerpt + suffixMarker;
    return {
      content: combined.slice(0, maxCharacters),
      truncated: true,
    };
  }

  // 2. Explicit prefix truncation fallback
  const prefix = content.slice(0, maxCharacters);
  const includedLines = prefix.split(/\r?\n/).length;
  const omittedLineCount = Math.max(1, totalLines - includedLines);
  const marker = `\n... [content truncated to fit size limit: ${omittedLineCount} lines omitted]`;

  return {
    content: prefix + marker,
    truncated: true,
  };
}
