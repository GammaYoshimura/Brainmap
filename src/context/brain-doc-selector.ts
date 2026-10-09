import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "../core/paths.js";
import { RankedItem } from "../router/ranking.js";
import { ContextSelectionInput } from "./context-selector.js";

export interface SelectedBrainDoc {
  path: string;
  score: number;
  reasons: string[];
  content?: string;
  sizeBytes: number;
}

export function selectRelevantBrainDocuments(
  input: ContextSelectionInput,
  options: { loadContent?: boolean } = { loadContent: true }
): SelectedBrainDoc[] {
  const selected: SelectedBrainDoc[] = [];
  const seenPaths = new Set<string>();

  const candidateItems: RankedItem[] = [
    ...input.routeResult.brainDocs,
    ...input.routeResult.adrs,
  ];

  for (const item of candidateItems) {
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
    });
  }

  return selected.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
}
