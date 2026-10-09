import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "../core/paths.js";
import { RankedItem } from "../router/ranking.js";
import { ContextSelectionInput } from "./context-selector.js";

export interface SelectedSourceFile {
  path: string;
  score: number;
  reasons: string[];
  content?: string;
  sizeBytes: number;
  isTest: boolean;
}

export function selectRelevantSourceCode(
  input: ContextSelectionInput,
  options: { loadContent?: boolean; includeTests?: boolean; minRelevanceScore?: number } = {
    loadContent: true,
    includeTests: true,
  }
): SelectedSourceFile[] {
  const selected: SelectedSourceFile[] = [];
  const seenPaths = new Set<string>();

  const minScore = options.minRelevanceScore ?? input.options?.minRelevanceScore;

  const testPaths = new Set(
    input.routeResult.tests.map((t) => normalizePath(t.path))
  );

  const candidateItems: { item: RankedItem; isTest: boolean }[] = [
    ...input.routeResult.sourceFiles.map((item) => ({ item, isTest: false })),
  ];

  if (options.includeTests !== false) {
    for (const testItem of input.routeResult.tests) {
      candidateItems.push({ item: testItem, isTest: true });
    }
  }

  for (const { item, isTest } of candidateItems) {
    if (minScore !== undefined && item.score < minScore) {
      continue;
    }
    const normalized = normalizePath(item.path);
    if (seenPaths.has(normalized)) continue;
    seenPaths.add(normalized);

    const fullPath = path.isAbsolute(normalized)
      ? normalized
      : path.join(input.projectRoot, normalized);

    let content: string | undefined;
    let sizeBytes = 0;

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      try {
        const rawContent = fs.readFileSync(fullPath, "utf8");
        sizeBytes = Buffer.byteLength(rawContent, "utf8");
        if (options.loadContent !== false) {
          content = rawContent;
        }
      } catch {
        // Ignored if unreadable
      }
    }

    selected.push({
      path: normalized,
      score: item.score,
      reasons: [...item.reasons],
      content,
      sizeBytes,
      isTest: isTest || testPaths.has(normalized),
    });
  }

  return selected.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
}
