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

export function matchGitignorePattern(
  normalizedRelativePath: string,
  rawPattern: string,
  isDirectory = false
): boolean {
  let pattern = rawPattern.trim();
  if (!pattern || pattern.startsWith("#")) {
    return false;
  }

  const matchesDirectoryOnly = pattern.endsWith("/");
  if (matchesDirectoryOnly) {
    pattern = pattern.slice(0, -1);
    if (!isDirectory && !normalizedRelativePath.includes("/")) {
      return false;
    }
  }

  const anchored = pattern.startsWith("/");
  if (anchored) {
    pattern = pattern.slice(1);
  }

  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/\{\{GLOBSTAR\}\}/g, ".*");

  const regex = anchored || pattern.includes("/")
    ? new RegExp(`^${regexStr}(/.*)?$`)
    : new RegExp(`(^|/)${regexStr}(/.*)?$`);

  return regex.test(normalizedRelativePath);
}

export function isGitignored(
  relativePath: string,
  patterns: string[],
  isDirectory = false
): boolean {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  let ignored = false;

  for (const rawPattern of patterns) {
    const trimmed = rawPattern.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const isNegation = trimmed.startsWith("!");
    const pattern = isNegation ? trimmed.slice(1) : trimmed;

    if (matchGitignorePattern(normalized, pattern, isDirectory)) {
      ignored = !isNegation;
    }
  }

  return ignored;
}

export function isGitDirectory(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  return normalized === ".git" || normalized.startsWith(".git/") || normalized.includes("/.git/") || normalized.endsWith("/.git");
}

export function shouldExclude(
  relativePath: string,
  config: ExclusionConfig,
  gitignorePatterns: string[] = [],
  isDirectory = false
): boolean {
  if (config.excludeGit && isGitDirectory(relativePath)) {
    return true;
  }
  if (config.useGitignore && gitignorePatterns.length > 0 && isGitignored(relativePath, gitignorePatterns, isDirectory)) {
    return true;
  }
  return false;
}
