import { normalizePath } from "../core/paths.js";
import { TaskQuery } from "./query.js";

export interface SubsystemCandidate {
  id: string;
  name: string;
  path: string;
  docPath?: string;
}

export interface SubsystemMatch {
  subsystem: SubsystemCandidate;
  matchedBy: "id" | "name" | "path" | "token";
  score: number;
}

export function resolveSubsystemMatches(
  candidates: SubsystemCandidate[],
  query: TaskQuery
): SubsystemMatch[] {
  if (!candidates || candidates.length === 0 || !query) {
    return [];
  }

  const matches: SubsystemMatch[] = [];
  const tokenSet = new Set(query.tokens.map((t) => t.toLowerCase()));
  const normalizedRaw = query.raw.toLowerCase();
  const normalizedQuery = query.normalized;

  for (const candidate of candidates) {
    const idLower = candidate.id.toLowerCase();
    const nameLower = candidate.name.toLowerCase();
    const pathNormalized = normalizePath(candidate.path).toLowerCase();
    const pathSegments = pathNormalized.split("/").filter(Boolean);

    // Exact id token match
    if (tokenSet.has(idLower)) {
      matches.push({
        subsystem: candidate,
        matchedBy: "id",
        score: 100,
      });
      continue;
    }

    // Exact name match in query string
    if (nameLower.length > 2 && (normalizedRaw.includes(nameLower) || normalizedQuery.includes(nameLower))) {
      matches.push({
        subsystem: candidate,
        matchedBy: "name",
        score: 90,
      });
      continue;
    }

    // Path segment match in tokens
    const matchedSegment = pathSegments.find((seg) => seg.length > 2 && tokenSet.has(seg));
    if (matchedSegment) {
      matches.push({
        subsystem: candidate,
        matchedBy: "path",
        score: 80,
      });
      continue;
    }

    // Substring token match (e.g. token "authentication" matches id "auth")
    const partialMatch = Array.from(tokenSet).find(
      (tok) => (tok.length >= 4 && idLower.includes(tok)) || (idLower.length >= 4 && tok.includes(idLower))
    );
    if (partialMatch) {
      matches.push({
        subsystem: candidate,
        matchedBy: "token",
        score: 60,
      });
    }
  }

  return matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.subsystem.id.localeCompare(b.subsystem.id);
  });
}
