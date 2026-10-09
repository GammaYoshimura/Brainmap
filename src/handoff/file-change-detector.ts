import child_process from "node:child_process";
import { normalizePath } from "../core/paths.js";

export interface ChangedFilesResult {
  hasGit: boolean;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  committedInLastCommit: string[];
  allCurrentChanges: string[];
}

export function detectChangedFiles(targetDir: string): ChangedFilesResult {
  try {
    const statusOutput = child_process
      .execSync("git status --porcelain", {
        cwd: targetDir,
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8",
      })
      .trim();

    let committedInLastCommit: string[] = [];
    try {
      const showOutput = child_process
        .execSync("git show --name-only --format= HEAD", {
          cwd: targetDir,
          stdio: ["ignore", "pipe", "ignore"],
          encoding: "utf8",
        })
        .trim();
      if (showOutput) {
        committedInLastCommit = showOutput
          .split(/\r?\n/)
          .map((f) => normalizePath(f.trim()))
          .filter(Boolean);
      }
    } catch {
      committedInLastCommit = [];
    }

    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];

    if (statusOutput) {
      const lines = statusOutput.split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        const x = line.charAt(0);
        const y = line.charAt(1);
        const filePath = normalizePath(line.slice(3).trim());

        if (x === "?" && y === "?") {
          untracked.push(filePath);
        } else {
          if (x !== " " && x !== "?") {
            staged.push(filePath);
          }
          if (y !== " " && y !== "?") {
            unstaged.push(filePath);
          }
        }
      }
    }

    const allChangesSet = new Set<string>([
      ...staged,
      ...unstaged,
      ...untracked,
    ]);

    return {
      hasGit: true,
      staged,
      unstaged,
      untracked,
      committedInLastCommit,
      allCurrentChanges: Array.from(allChangesSet).sort(),
    };
  } catch {
    return {
      hasGit: false,
      staged: [],
      unstaged: [],
      untracked: [],
      committedInLastCommit: [],
      allCurrentChanges: [],
    };
  }
}
