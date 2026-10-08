export interface TaskQuery {
  raw: string;
  normalized: string;
  tokens: string[];
}

export function normalizeQueryText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\-\.\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeQuery(normalizedText: string): string[] {
  const words = normalizedText
    .split(/[\s\/\\]+/)
    .map((w) => w.trim().replace(/^[-.]+/, "").replace(/[-.]+$/, ""))
    .filter((w) => w.length > 0);

  return Array.from(new Set(words));
}

export function parseTaskQuery(args: string | string[]): TaskQuery | null {
  const raw = Array.isArray(args) ? args.join(" ").trim() : args.trim();
  if (!raw) {
    return null;
  }

  const normalized = normalizeQueryText(raw);
  const tokens = tokenizeQuery(normalized);

  return {
    raw,
    normalized,
    tokens,
  };
}
