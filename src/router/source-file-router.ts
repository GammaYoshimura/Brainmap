import fs from "node:fs";
import path from "node:path";
import { normalizePath, toRelativePath } from "../core/paths.js";
import { traverseProject } from "../scanner/scanner.js";
import { TaskQuery } from "./query.js";
import { resolveExactPathMatches } from "./path-matcher.js";
import { resolveFilenameMatches } from "./filename-matcher.js";
import { resolveSubsystemMatches, SubsystemCandidate } from "./subsystem-matcher.js";
import { extractSymbolsFromContent, resolveSymbolMatches, SymbolDeclaration } from "./symbol-matcher.js";
import { createRelevanceRanking, RankedItem, CandidateMatchInput } from "./ranking.js";

export function isTestPath(relativePath: string): boolean {
  const norm = normalizePath(relativePath).toLowerCase();
  return (
    norm.startsWith("tests/") ||
    norm.startsWith("test/") ||
    norm.includes("/tests/") ||
    norm.includes("/test/") ||
    norm.includes("/__tests__/") ||
    /\.(test|spec)\.[^.]+$/.test(norm)
  );
}

export function isSourceFile(relativePath: string): boolean {
  const norm = normalizePath(relativePath).toLowerCase();
  if (norm.startsWith(".brain/") || norm.startsWith(".git/")) {
    return false;
  }
  if (isTestPath(norm)) {
    return false;
  }
  // Common programming and config file extensions
  return /\.(ts|js|mjs|cjs|py|go|rs|dart|php|cs|java|cpp|c|h|json|yaml|yml|toml)$/.test(norm);
}

export interface RouteSourceFilesOptions {
  files?: string[];
  subsystems?: SubsystemCandidate[];
}

export function routeRelevantSourceFiles(
  projectRoot: string,
  query: TaskQuery,
  options: RouteSourceFilesOptions = {}
): RankedItem[] {
  let fileList = options.files;
  if (!fileList) {
    const traversal = traverseProject(projectRoot);
    fileList = traversal.files.map((f) => toRelativePath(projectRoot, f));
  }

  const sourceFiles = fileList.filter(isSourceFile);
  if (sourceFiles.length === 0 || !query) {
    return [];
  }

  const candidateInputs: CandidateMatchInput[] = [];

  // 1. Exact path matches
  const exactPathMatches = resolveExactPathMatches(sourceFiles, query);
  for (const p of exactPathMatches) {
    candidateInputs.push({
      path: p.path,
      category: "source-file",
      score: 100,
      reason: `exact path match (${p.matchedBy})`,
    });
  }

  // 2. Filename matches
  const filenameMatches = resolveFilenameMatches(sourceFiles, query);
  for (const f of filenameMatches) {
    candidateInputs.push({
      path: f.path,
      category: "source-file",
      score: f.matchType === "exact-filename" ? 90 : 70,
      reason: `filename match (${f.matchType})`,
    });
  }

  // 3. Subsystem matches
  if (options.subsystems && options.subsystems.length > 0) {
    const matchedSubsystems = resolveSubsystemMatches(options.subsystems, query);
    for (const subMatch of matchedSubsystems) {
      const subPathNorm = normalizePath(subMatch.subsystem.path).toLowerCase();
      for (const file of sourceFiles) {
        const fileNorm = normalizePath(file).toLowerCase();
        if (fileNorm.startsWith(subPathNorm + "/")) {
          candidateInputs.push({
            path: file,
            category: "source-file",
            score: Math.round(subMatch.score * 0.75),
            reason: `subsystem match (${subMatch.subsystem.id})`,
          });
        }
      }
    }
  }

  // 4. Symbol matches from source files
  const declarations: SymbolDeclaration[] = [];
  for (const relPath of sourceFiles) {
    const fullPath = path.isAbsolute(relPath) ? relPath : path.join(projectRoot, relPath);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        // Limit symbol scanning to reasonable files (<100KB)
        if (content.length < 100000) {
          const symbols = extractSymbolsFromContent(content, relPath);
          declarations.push(...symbols);
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  const symbolMatches = resolveSymbolMatches(declarations, query);
  for (const sym of symbolMatches) {
    candidateInputs.push({
      path: sym.path,
      category: "source-file",
      score: sym.score,
      reason: `symbol match: ${sym.symbol}`,
    });
  }

  const ranked = createRelevanceRanking(candidateInputs);
  return ranked.filter((item) => item.category === "source-file");
}
