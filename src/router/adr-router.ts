import fs from "node:fs";
import path from "node:path";
import { normalizePath, toRelativePath } from "../core/paths.js";
import { TaskQuery } from "./query.js";
import { createRelevanceRanking, RankedItem, CandidateMatchInput } from "./ranking.js";

export interface AdrRecord {
  path: string;
  relativePath: string;
  id: string;
  title: string;
  status?: string;
  content: string;
}

export function parseAdrContent(content: string, filePath: string, projectRoot: string): AdrRecord {
  const relativePath = toRelativePath(projectRoot, filePath);
  const filename = path.posix.basename(normalizePath(relativePath));

  // Extract ID from filename like "0001-foo.md"
  const idMatch = filename.match(/^(\d+)/);
  const id = idMatch ? idMatch[1] : filename.replace(/\.md$/, "");

  // Extract title
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filename;

  // Extract status
  const statusMatch = content.match(/status[:\s]+(\w+)/i);
  const status = statusMatch ? statusMatch[1].trim() : undefined;

  return {
    path: filePath,
    relativePath,
    id,
    title,
    status,
    content,
  };
}

export function discoverAdrs(projectRoot: string): AdrRecord[] {
  const decisionsDir = path.join(projectRoot, ".brain", "decisions");
  if (!fs.existsSync(decisionsDir) || !fs.statSync(decisionsDir).isDirectory()) {
    return [];
  }

  const entries = fs.readdirSync(decisionsDir, { withFileTypes: true });
  const adrs: AdrRecord[] = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      const fullPath = path.join(decisionsDir, entry.name);
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        adrs.push(parseAdrContent(content, fullPath, projectRoot));
      } catch {
        // Skip unreadable files
      }
    }
  }

  return adrs.sort((a, b) => a.id.localeCompare(b.id));
}

export function routeRelevantAdrs(
  projectRoot: string,
  query: TaskQuery
): RankedItem<AdrRecord>[] {
  const adrs = discoverAdrs(projectRoot);
  if (adrs.length === 0 || !query) {
    return [];
  }

  const candidateInputs: CandidateMatchInput[] = [];
  const tokenSet = new Set(query.tokens.map((t) => t.toLowerCase()));
  const normalizedRaw = query.raw.toLowerCase();
  const hasAdrIntent = tokenSet.has("adr") || tokenSet.has("decision") || tokenSet.has("decisions");

  for (const adr of adrs) {
    let score = 0;
    const reasons: string[] = [];

    // 1. Direct ID match (e.g. "0001" or "adr-0001")
    if (tokenSet.has(adr.id.toLowerCase()) || normalizedRaw.includes(`adr-${adr.id}`) || normalizedRaw.includes(adr.id)) {
      score = Math.max(score, 100);
      reasons.push(`exact ADR id match (${adr.id})`);
    }

    // 2. Title token matches
    const titleTokens = adr.title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
    const titleHits = titleTokens.filter((tok) => tokenSet.has(tok));
    if (titleHits.length > 0) {
      const titleScore = Math.min(95, 60 + titleHits.length * 15);
      score = Math.max(score, titleScore);
      reasons.push(`title match: ${titleHits.join(", ")}`);
    }

    // 3. ADR intent boost
    if (hasAdrIntent && score > 0) {
      score = Math.min(100, score + 10);
      reasons.push("ADR query intent");
    }

    // 4. Content token hits (if query contains substantive technical terms in ADR content)
    if (score === 0) {
      const contentLower = adr.content.toLowerCase();
      const contentHits = Array.from(tokenSet).filter((t) => t.length > 3 && contentLower.includes(t));
      if (contentHits.length >= 2) {
        score = 65;
        reasons.push(`content keyword hits (${contentHits.slice(0, 3).join(", ")})`);
      }
    }

    if (score > 0) {
      for (const reason of reasons) {
        candidateInputs.push({
          path: adr.relativePath,
          category: "adr",
          score,
          reason,
          metadata: adr,
        });
      }
    }
  }

  const ranked = createRelevanceRanking<AdrRecord>(candidateInputs);
  return ranked.filter((item) => item.category === "adr");
}
