import path from "node:path";
import { normalizePath } from "./paths.js";

/**
 * Standard recognized code file extensions.
 */
export const CODE_EXTENSIONS = new Set<string>([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".dart",
  ".py",
  ".php",
  ".rs",
  ".go",
  ".cs",
  ".cpp",
  ".cc",
  ".cxx",
  ".hpp",
  ".c",
  ".h",
  ".java",
  ".kt",
  ".kts",
  ".swift",
  ".rb",
  ".sh",
  ".bash",
  ".ps1",
  ".sql",
]);

/**
 * Standard recognized configuration and project data file extensions.
 */
export const CONFIG_DATA_EXTENSIONS = new Set<string>([
  ".json",
  ".yaml",
  ".yml",
  ".toml",
]);

/**
 * Unified set of all supported source-file extensions.
 */
export const ALL_SOURCE_EXTENSIONS = new Set<string>([
  ...CODE_EXTENSIONS,
  ...CONFIG_DATA_EXTENSIONS,
]);

export function isSourceExtension(extensionOrPath: string): boolean {
  const ext = extensionOrPath.startsWith(".")
    ? extensionOrPath.toLowerCase()
    : path.extname(extensionOrPath).toLowerCase();
  return ALL_SOURCE_EXTENSIONS.has(ext);
}

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
  const ext = path.extname(norm).toLowerCase();
  return ALL_SOURCE_EXTENSIONS.has(ext);
}
