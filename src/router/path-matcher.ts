import { normalizePath } from "../core/paths.js";
import { TaskQuery } from "./query.js";

export interface ExactPathMatch {
  path: string;
  matchedBy: "token" | "substring";
}

export function resolveExactPathMatches(
  candidatePaths: string[],
  query: TaskQuery
): ExactPathMatch[] {
  if (!candidatePaths || candidatePaths.length === 0 || !query) {
    return [];
  }

  const matches: ExactPathMatch[] = [];
  const normalizedQueryRaw = normalizePath(query.raw.toLowerCase());
  const tokenSet = new Set(query.tokens.map((t) => normalizePath(t.toLowerCase())));

  for (const candidate of candidatePaths) {
    const normalizedCandidate = normalizePath(candidate).toLowerCase();

    // Direct token equality
    if (tokenSet.has(normalizedCandidate)) {
      matches.push({
        path: candidate,
        matchedBy: "token",
      });
      continue;
    }

    // Substring in query (e.g., query contains "look at src/commands/route.ts carefully")
    if (normalizedCandidate.length > 2 && normalizedQueryRaw.includes(normalizedCandidate)) {
      matches.push({
        path: candidate,
        matchedBy: "substring",
      });
    }
  }

  return matches.sort((a, b) => a.path.localeCompare(b.path));
}
