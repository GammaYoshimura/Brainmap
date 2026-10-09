import fs from "node:fs";
import path from "node:path";

export const COMMON_DEPENDENCY_DIRECTORIES: readonly string[] = [
  "node_modules",
  "vendor",
  ".pub-cache",
  "Pods",
  ".venv",
  "venv",
  "env",
];

export const COMMON_BUILD_DIRECTORIES: readonly string[] = [
  "dist",
  "build",
  "out",
  "target",
  "bin",
  "obj",
  ".dart_tool",
  "coverage",
];

export interface ExclusionConfig {
  useGitignore: boolean;
  excludeGit: boolean;
  excludeBrain?: boolean;
  excludeDependencies: boolean;
  excludeBuildOutputs: boolean;
  ignoredDirectories: string[];
  customPatterns: string[];
}

export function createDefaultExclusionConfig(): ExclusionConfig {
  return {
    useGitignore: true,
    excludeGit: true,
    excludeBrain: true,
    excludeDependencies: true,
    excludeBuildOutputs: true,
    ignoredDirectories: [...COMMON_DEPENDENCY_DIRECTORIES, ...COMMON_BUILD_DIRECTORIES],
    customPatterns: [],
  };
}

export function isBrainDirectory(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  return (
    normalized === ".brain" ||
    normalized.startsWith(".brain/") ||
    normalized.includes("/.brain/") ||
    normalized.endsWith("/.brain")
  );
}

export function isDependencyDirectory(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const segments = normalized.split("/");
  return segments.some((segment) => COMMON_DEPENDENCY_DIRECTORIES.includes(segment));
}

export function isBuildDirectory(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const segments = normalized.split("/");
  return segments.some((segment) => COMMON_BUILD_DIRECTORIES.includes(segment));
}

export function detectGitignore(projectRoot: string): string | null {
  const gitignorePath = path.join(projectRoot, ".gitignore");
  if (fs.existsSync(gitignorePath) && fs.statSync(gitignorePath).isFile()) {
    return gitignorePath;
  }
  return null;
}

export function loadGitignorePatterns(projectRoot: string): string[] {
  const patterns: string[] = [];
  const gitignorePath = detectGitignore(projectRoot);
  if (gitignorePath) {
    const content = fs.readFileSync(gitignorePath, "utf8");
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
    patterns.push(...lines);
  }

  const gitExcludePath = path.join(projectRoot, ".git", "info", "exclude");
  if (fs.existsSync(gitExcludePath) && fs.statSync(gitExcludePath).isFile()) {
    try {
      const content = fs.readFileSync(gitExcludePath, "utf8");
      const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"));
      patterns.push(...lines);
    } catch {
      // Ignored if unreadable
    }
  }

  return patterns;
}

export interface GitignoreRule {
  raw: string;
  pattern: string;
  isNegation: boolean;
  directoryOnly: boolean;
  basePrefix: string;
  regex: RegExp;
}

export function compileGitignorePattern(
  rawPattern: string,
  basePrefix = ""
): GitignoreRule | null {
  let pattern = rawPattern.trim();
  if (!pattern || pattern.startsWith("#")) {
    return null;
  }

  const isNegation = pattern.startsWith("!");
  if (isNegation) {
    pattern = pattern.slice(1).trim();
  }
  if (!pattern) {
    return null;
  }

  const directoryOnly = pattern.endsWith("/");
  if (directoryOnly) {
    pattern = pattern.slice(0, -1);
  }

  const anchored = pattern.startsWith("/");
  if (anchored) {
    pattern = pattern.slice(1);
  }

  const hasSlash = anchored || pattern.includes("/");

  let regexBody = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*" && pattern[i + 1] === "*") {
      if (pattern[i + 2] === "/") {
        regexBody += "(?:.*/)?";
        i += 2;
      } else {
        regexBody += ".*";
        i++;
      }
    } else if (c === "*") {
      regexBody += "[^/]*";
    } else if (c === "?") {
      regexBody += "[^/]";
    } else if (c === "[") {
      const closeIdx = pattern.indexOf("]", i);
      if (closeIdx !== -1) {
        regexBody += pattern.slice(i, closeIdx + 1);
        i = closeIdx;
      } else {
        regexBody += "\\[";
      }
    } else if ("()+{}^$|\\.".includes(c)) {
      regexBody += "\\" + c;
    } else {
      regexBody += c;
    }
  }

  const prefixNorm = basePrefix ? basePrefix.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "") : "";
  const prefixPart = prefixNorm ? `${prefixNorm}/` : "";
  const childMatch = "(?:/.*)?";

  let fullRegexStr: string;
  if (hasSlash) {
    fullRegexStr = `^${prefixPart}${regexBody}${childMatch}$`;
  } else {
    fullRegexStr = `^(?:.*\\/)?${prefixPart}${regexBody}${childMatch}$`;
  }

  return {
    raw: rawPattern,
    pattern,
    isNegation,
    directoryOnly,
    basePrefix: prefixNorm,
    regex: new RegExp(fullRegexStr, "i"),
  };
}

export function parseGitignoreLines(patterns: string[], basePrefix = ""): GitignoreRule[] {
  const rules: GitignoreRule[] = [];
  for (const raw of patterns) {
    const compiled = compileGitignorePattern(raw, basePrefix);
    if (compiled) {
      rules.push(compiled);
    }
  }
  return rules;
}

export function matchCompiledRule(
  normalizedRelativePath: string,
  rule: GitignoreRule,
  isDirectory = false
): boolean {
  const norm = normalizedRelativePath.replace(/\\/g, "/").replace(/^\/+/, "");

  if (rule.basePrefix) {
    if (norm !== rule.basePrefix && !norm.startsWith(rule.basePrefix + "/")) {
      return false;
    }
  }

  if (!rule.regex.test(norm)) {
    return false;
  }

  if (rule.directoryOnly && !isDirectory) {
    const relToScope = rule.basePrefix ? norm.slice(rule.basePrefix.length + 1) : norm;
    if (!relToScope.includes("/")) {
      return false;
    }
  }

  return true;
}

export function matchGitignorePattern(
  normalizedRelativePath: string,
  rawPattern: string,
  isDirectory = false
): boolean {
  const rule = compileGitignorePattern(rawPattern, "");
  if (!rule) return false;
  return matchCompiledRule(normalizedRelativePath, rule, isDirectory);
}

export function filterIgnoredFiles(
  filePaths: string[],
  config: ExclusionConfig,
  rootPath: string
): string[] {
  const gitignorePatterns = config.useGitignore ? loadGitignorePatterns(rootPath) : [];
  return filePaths.filter((filePath) => {
    const relPath = path.isAbsolute(filePath)
      ? path.relative(rootPath, filePath).replace(/\\/g, "/")
      : filePath.replace(/\\/g, "/");
    return !shouldExclude(relPath, config, gitignorePatterns, false);
  });
}

export function isGitignoredWithRules(
  relativePath: string,
  rules: GitignoreRule[],
  isDirectory = false
): boolean {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  let ignored = false;

  for (const rule of rules) {
    if (matchCompiledRule(normalized, rule, isDirectory)) {
      ignored = !rule.isNegation;
    }
  }

  return ignored;
}

export function isGitignored(
  relativePath: string,
  patterns: string[],
  isDirectory = false
): boolean {
  const rules = parseGitignoreLines(patterns, "");
  return isGitignoredWithRules(relativePath, rules, isDirectory);
}

export function isGitDirectory(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  return normalized === ".git" || normalized.startsWith(".git/") || normalized.includes("/.git/") || normalized.endsWith("/.git");
}

export function shouldExcludeWithRules(
  relativePath: string,
  config: ExclusionConfig,
  gitignoreRules: GitignoreRule[] = [],
  isDirectory = false
): boolean {
  if (config.excludeGit && isGitDirectory(relativePath)) {
    return true;
  }
  if (config.excludeBrain && isBrainDirectory(relativePath)) {
    return true;
  }
  if (config.excludeDependencies && isDependencyDirectory(relativePath)) {
    return true;
  }
  if (config.excludeBuildOutputs && isBuildDirectory(relativePath)) {
    return true;
  }
  if (config.ignoredDirectories && config.ignoredDirectories.length > 0) {
    const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    const segments = normalized.split("/");
    if (segments.some((seg) => config.ignoredDirectories.includes(seg))) {
      return true;
    }
  }
  if (config.customPatterns && config.customPatterns.length > 0) {
    if (isGitignored(relativePath, config.customPatterns, isDirectory)) {
      return true;
    }
  }
  if (config.useGitignore && gitignoreRules.length > 0 && isGitignoredWithRules(relativePath, gitignoreRules, isDirectory)) {
    return true;
  }
  return false;
}

export function shouldExclude(
  relativePath: string,
  config: ExclusionConfig,
  gitignorePatterns: string[] = [],
  isDirectory = false
): boolean {
  const rules = parseGitignoreLines(gitignorePatterns, "");
  return shouldExcludeWithRules(relativePath, config, rules, isDirectory);
}
