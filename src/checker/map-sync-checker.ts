import fs from "node:fs";
import path from "node:path";
import { detectChangedFiles } from "../handoff/file-change-detector.js";
import { normalizePath } from "../core/paths.js";

export interface MapSyncIssue {
  unmappedFile: string;
  reason: "missing_from_project_map";
}

export function detectUnreflectedMapChanges(
  targetDir: string,
  brainDir: string = path.join(targetDir, ".brain")
): MapSyncIssue[] {
  const issues: MapSyncIssue[] = [];
  const projectMapPath = path.join(brainDir, "project-map.md");
  if (!fs.existsSync(projectMapPath)) {
    return issues;
  }

  const projectMapContent = fs.readFileSync(projectMapPath, "utf8");

  // Get recently changed files
  const changeResult = detectChangedFiles(targetDir);
  const candidates = changeResult.allCurrentChanges.length > 0
    ? changeResult.allCurrentChanges
    : changeResult.committedInLastCommit;

  for (const file of candidates) {
    const norm = normalizePath(file);
    // Ignore private local trackers, hidden files, or brain internal state
    if (
      norm.startsWith(".git") ||
      norm.startsWith(".micro-brain") ||
      norm.includes("master_prompt") ||
      norm.startsWith(".brain/")
    ) {
      continue;
    }

    const basename = path.basename(norm);
    if (!projectMapContent.includes(basename)) {
      issues.push({
        unmappedFile: norm,
        reason: "missing_from_project_map",
      });
    }
  }

  return issues;
}
