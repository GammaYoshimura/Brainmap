import { TaskQuery } from "./query.js";

export interface SymbolDeclaration {
  path: string;
  symbol: string;
  kind?: "function" | "class" | "interface" | "type" | "variable";
}

export interface SymbolMatch {
  path: string;
  symbol: string;
  kind?: string;
  score: number;
}

const SYMBOL_REGEX = /(?:export\s+(?:async\s+)?(?:function|class|interface|type|const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*))|(?:(?:def|class)\s+([A-Za-z_$][A-Za-z0-9_$]*))/g;

export function extractSymbolsFromContent(content: string, filePath: string): SymbolDeclaration[] {
  const declarations: SymbolDeclaration[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = SYMBOL_REGEX.exec(content)) !== null) {
    const symbol = match[1] || match[2];
    if (symbol && !seen.has(symbol)) {
      seen.add(symbol);
      declarations.push({
        path: filePath,
        symbol,
      });
    }
  }

  return declarations;
}

export function resolveSymbolMatches(
  declarations: SymbolDeclaration[],
  query: TaskQuery
): SymbolMatch[] {
  if (!declarations || declarations.length === 0 || !query) {
    return [];
  }

  const matches: SymbolMatch[] = [];
  const tokenSetLower = new Set(query.tokens.map((t) => t.toLowerCase()));
  const rawWords = new Set(query.raw.split(/[^A-Za-z0-9_$]+/).filter(Boolean));

  for (const decl of declarations) {
    // Exact case-sensitive match in raw words
    if (rawWords.has(decl.symbol)) {
      matches.push({
        path: decl.path,
        symbol: decl.symbol,
        kind: decl.kind,
        score: 100,
      });
      continue;
    }

    // Case-insensitive token match
    if (tokenSetLower.has(decl.symbol.toLowerCase())) {
      matches.push({
        path: decl.path,
        symbol: decl.symbol,
        kind: decl.kind,
        score: 85,
      });
    }
  }

  return matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.path.localeCompare(b.path);
  });
}
