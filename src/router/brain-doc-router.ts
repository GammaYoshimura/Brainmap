import fs from "node:fs";
import path from "node:path";
import { normalizePath, toRelativePath } from "../core/paths.js";
import { TaskQuery } from "./query.js";
import { BrainDocCandidate, resolveBrainDocMatches } from "./brain-doc-matcher.js";
import { resolveExactPathMatches } from "./path-matcher.js";
import { resolveFilenameMatches } from "./filename-matcher.js";
import { createRelevanceRanking, RankedItem, CandidateMatchInput } from "./ranking.js";

export function extractDocumentTitle(filePath: string): string | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
}

export function inferDocumentRole(relativePath: string): string {
  const norm = normalizePath(relativePath).toLowerCase();
  const filename = path.posix.basename(norm);

  if (filename === "architecture.md") return "constitution";
  if (filename === "state.md") return "state";
  if (filename === "handoff.md") return "handoff";
  if (filename === "index.md" && !norm.includes("subsystems/")) return "router";
  if (filename === "project-map.md") return "specialized";
  if (norm.includes("decisions/")) return "decision";
  if (norm.includes("subsystems/")) return "subsystem";
  return "specialized";
}

export function discoverBrainDocuments(projectRoot: string): BrainDocCandidate[] {
  const brainDir = path.join(projectRoot, ".brain");
  if (!fs.existsSync(brainDir) || !fs.statSync(brainDir).isDirectory()) {
    return [];
  }

  const docs: BrainDocCandidate[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const relativePath = toRelativePath(projectRoot, fullPath);
        const title = extractDocumentTitle(fullPath);
        const role = inferDocumentRole(relativePath);
        docs.push({
          path: fullPath,
          relativePath,
          title,
          role,
        });
      }
    }
  }

  walk(brainDir);
  return docs.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function routeRelevantBrainDocs(
  projectRoot: string,
  query: TaskQuery
): RankedItem<BrainDocCandidate>[] {
  const docs = discoverBrainDocuments(projectRoot);
  if (docs.length === 0 || !query) {
    return [];
  }

  const candidateInputs: CandidateMatchInput[] = [];

  // 1. Role-intent and Brain semantic matcher
  const brainMatches = resolveBrainDocMatches(docs, query);
  for (const m of brainMatches) {
    candidateInputs.push({
      path: m.document.relativePath,
      category: "brain-doc",
      score: m.score,
      reason: `brain match (${m.matchedBy})`,
      metadata: m.document,
    });
  }

  // 2. Exact path matches
  const exactPathMatches = resolveExactPathMatches(
    docs.map((d) => d.relativePath),
    query
  );
  for (const p of exactPathMatches) {
    candidateInputs.push({
      path: p.path,
      category: "brain-doc",
      score: 100,
      reason: `exact path match (${p.matchedBy})`,
    });
  }

  // 3. Filename matches
  const filenameMatches = resolveFilenameMatches(
    docs.map((d) => d.relativePath),
    query
  );
  for (const f of filenameMatches) {
    candidateInputs.push({
      path: f.path,
      category: "brain-doc",
      score: f.matchType === "exact-filename" ? 95 : 75,
      reason: `filename match (${f.matchType})`,
    });
  }

  const ranked = createRelevanceRanking<BrainDocCandidate>(candidateInputs);
  return ranked.filter((item) => item.category === "brain-doc");
}
