import fs from "node:fs";
import path from "node:path";

export interface ExclusionConfig {
  useGitignore: boolean;
  excludeGit: boolean;
  ignoredDirectories: string[];
  customPatterns: string[];
}

export function createDefaultExclusionConfig(): ExclusionConfig {
  return {
    useGitignore: true,
    excludeGit: true,
    ignoredDirectories: [],
    customPatterns: [],
  };
}

export function detectGitignore(projectRoot: string): string | null {
  const gitignorePath = path.join(projectRoot, ".gitignore");
  if (fs.existsSync(gitignorePath) && fs.statSync(gitignorePath).isFile()) {
    return gitignorePath;
  }
  return null;
}

export function loadGitignorePatterns(projectRoot: string): string[] {
  const gitignorePath = detectGitignore(projectRoot);
  if (!gitignorePath) {
    return [];
  }
  const content = fs.readFileSync(gitignorePath, "utf8");
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}
