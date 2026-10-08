import path from "node:path";
import { normalizePath } from "../core/paths.js";
import { TaskQuery } from "./query.js";

export interface BrainDocCandidate {
  path: string;
  relativePath: string;
  title?: string;
  role?: string;
}

export interface BrainDocMatch {
  document: BrainDocCandidate;
  matchedBy: "role-intent" | "exact-path" | "title" | "token";
  score: number;
}

const ROLE_INTENT_KEYWORDS: Record<string, string[]> = {
  constitution: ["architecture", "constitution", "invariant", "invariants", "principle", "principles", "boundary", "rules"],
  state: ["state", "status", "progress", "blocker", "blockers", "implemented", "roadmap"],
  handoff: ["handoff", "continuation", "session", "resume", "next-action"],
  router: ["index", "router", "navigation", "global"],
  decision: ["adr", "decision", "decisions", "record", "rationale"],
};

export function resolveBrainDocMatches(
  documents: BrainDocCandidate[],
  query: TaskQuery
): BrainDocMatch[] {
  if (!documents || documents.length === 0 || !query) {
    return [];
  }

  const matches: BrainDocMatch[] = [];
  const tokenSet = new Set(query.tokens.map((t) => t.toLowerCase()));
  const normalizedRaw = query.raw.toLowerCase();

  for (const doc of documents) {
    const relPath = normalizePath(doc.relativePath).toLowerCase();
    const filename = path.posix.basename(relPath);
    const titleLower = doc.title ? doc.title.toLowerCase() : "";

    // 1. Exact path or filename match
    if (tokenSet.has(relPath) || tokenSet.has(filename) || normalizedRaw.includes(relPath)) {
      matches.push({
        document: doc,
        matchedBy: "exact-path",
        score: 100,
      });
      continue;
    }

    // 2. Role intent match
    let roleMatched = false;
    for (const [role, keywords] of Object.entries(ROLE_INTENT_KEYWORDS)) {
      const isMatchingRole =
        (doc.role && doc.role.toLowerCase() === role) ||
        (role === "constitution" && filename.includes("architecture")) ||
        (role === "state" && filename.includes("state")) ||
        (role === "handoff" && filename.includes("handoff")) ||
        (role === "decision" && (relPath.includes("decisions/") || filename.startsWith("adr")));

      if (isMatchingRole) {
        const hasKeyword = keywords.some((kw) => tokenSet.has(kw) || normalizedRaw.includes(kw));
        if (hasKeyword) {
          matches.push({
            document: doc,
            matchedBy: "role-intent",
            score: 90,
          });
          roleMatched = true;
          break;
        }
      }
    }
    if (roleMatched) {
      continue;
    }

    // 3. Title match
    if (titleLower.length > 2 && (normalizedRaw.includes(titleLower) || Array.from(tokenSet).some((t) => t.length > 2 && titleLower.includes(t)))) {
      matches.push({
        document: doc,
        matchedBy: "title",
        score: 75,
      });
      continue;
    }

    // 4. Subsystem doc match (e.g. .brain/subsystems/scanner/index.md matching "scanner")
    if (relPath.includes("subsystems/")) {
      const parts = relPath.split("/");
      const subIdx = parts.indexOf("subsystems");
      if (subIdx >= 0 && parts[subIdx + 1]) {
        const subId = parts[subIdx + 1];
        if (tokenSet.has(subId)) {
          matches.push({
            document: doc,
            matchedBy: "token",
            score: 85,
          });
          continue;
        }
      }
    }

    // 5. General token match in relPath
    const pathWords = relPath.replace(/[-_.\/]/g, " ").split(" ").filter((w) => w.length > 2);
    if (pathWords.some((w) => tokenSet.has(w))) {
      matches.push({
        document: doc,
        matchedBy: "token",
        score: 60,
      });
    }
  }

  return matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.document.relativePath.localeCompare(b.document.relativePath);
  });
}
