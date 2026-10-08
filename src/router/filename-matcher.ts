import path from "node:path";
import { normalizePath } from "../core/paths.js";
import { TaskQuery } from "./query.js";

export interface FilenameMatch {
  path: string;
  filename: string;
  stem: string;
  matchType: "exact-filename" | "stem";
}

export function resolveFilenameMatches(
  candidatePaths: string[],
  query: TaskQuery
): FilenameMatch[] {
  if (!candidatePaths || candidatePaths.length === 0 || !query) {
    return [];
  }

  const matches: FilenameMatch[] = [];
  const tokenSet = new Set(query.tokens.map((t) => t.toLowerCase()));
  const normalizedRaw = query.raw.toLowerCase();

  for (const candidate of candidatePaths) {
    const normalized = normalizePath(candidate);
    const filename = path.posix.basename(normalized);
    const lowerFilename = filename.toLowerCase();

    const lastDotIndex = filename.lastIndexOf(".");
    const stem = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
    const lowerStem = stem.toLowerCase();
    const baseStem = filename.split(".")[0].toLowerCase();

    // Check exact filename match in tokens or raw string
    if (tokenSet.has(lowerFilename) || normalizedRaw.includes(lowerFilename)) {
      matches.push({
        path: candidate,
        filename,
        stem,
        matchType: "exact-filename",
      });
      continue;
    }

    // Check file stem match (if stem length >= 3 to avoid short noise like 'a', 'id', 'js')
    if (
      (lowerStem.length >= 3 && (tokenSet.has(lowerStem) || tokenSet.has(lowerStem.replace(/[-_]/g, "")))) ||
      (baseStem.length >= 3 && tokenSet.has(baseStem))
    ) {
      matches.push({
        path: candidate,
        filename,
        stem,
        matchType: "stem",
      });
    }
  }

  return matches.sort((a, b) => {
    if (a.matchType !== b.matchType) {
      return a.matchType === "exact-filename" ? -1 : 1;
    }
    return a.path.localeCompare(b.path);
  });
}
