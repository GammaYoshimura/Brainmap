import path from "node:path";
import { normalizePath, toRelativePath } from "../core/paths.js";
import { traverseProject } from "../scanner/scanner.js";
import { TaskQuery } from "./query.js";
import { isTestPath } from "./source-file-router.js";
import { resolveExactPathMatches } from "./path-matcher.js";
import { resolveFilenameMatches } from "./filename-matcher.js";
import { createRelevanceRanking, RankedItem, CandidateMatchInput } from "./ranking.js";

export interface RouteTestsOptions {
  files?: string[];
  relevantSourceFiles?: string[];
}

export function routeRelevantTests(
  projectRoot: string,
  query: TaskQuery,
  options: RouteTestsOptions = {}
): RankedItem[] {
  let fileList = options.files;
  if (!fileList) {
    const traversal = traverseProject(projectRoot);
    fileList = traversal.files.map((f) => toRelativePath(projectRoot, f));
  }

  const testFiles = fileList.filter((f) => isTestPath(f));
  if (testFiles.length === 0 || !query) {
    return [];
  }

  const candidateInputs: CandidateMatchInput[] = [];

  // 1. Exact path matches on tests
  const exactPathMatches = resolveExactPathMatches(testFiles, query);
  for (const p of exactPathMatches) {
    candidateInputs.push({
      path: p.path,
      category: "test",
      score: 100,
      reason: `exact test path match (${p.matchedBy})`,
    });
  }

  // 2. Filename and stem matches on tests
  const filenameMatches = resolveFilenameMatches(testFiles, query);
  for (const f of filenameMatches) {
    candidateInputs.push({
      path: f.path,
      category: "test",
      score: f.matchType === "exact-filename" ? 95 : 75,
      reason: `test filename match (${f.matchType})`,
    });
  }

  // 3. Correspondence to relevant source files
  if (options.relevantSourceFiles && options.relevantSourceFiles.length > 0) {
    for (const srcFile of options.relevantSourceFiles) {
      const srcNorm = normalizePath(srcFile);
      const srcBase = path.posix.basename(srcNorm).replace(/\.[^.]+$/, "").toLowerCase();

      for (const tFile of testFiles) {
        const tNorm = normalizePath(tFile).toLowerCase();
        const tBase = path.posix.basename(tNorm).replace(/\.(test|spec)\.[^.]+$/, "").toLowerCase();

        if (tBase === srcBase || tBase.includes(srcBase) || srcBase.includes(tBase)) {
          candidateInputs.push({
            path: tFile,
            category: "test",
            score: 85,
            reason: `corresponds to relevant source file (${srcFile})`,
          });
        }
      }
    }
  }

  const ranked = createRelevanceRanking(candidateInputs);
  return ranked.filter((item) => item.category === "test");
}
