import path from "node:path";

/**
 * Normalizes any filesystem path into a deterministic forward-slash (POSIX-style) representation.
 */
export function normalizePath(inputPath: string): string {
  if (!inputPath) return "";
  let normalized = inputPath.replace(/\\/g, "/");
  // Normalize consecutive slashes except starting double slash if UNC
  normalized = normalized.replace(/(?<!^)\/\/+/g, "/");
  return normalized;
}

/**
 * Returns a normalized relative path from a base directory.
 */
export function toRelativePath(baseDir: string, targetPath: string): string {
  const relative = path.relative(baseDir, targetPath);
  return normalizePath(relative);
}

/**
 * Resolves a normalized absolute path from a base directory and relative path.
 */
export function toAbsolutePath(baseDir: string, relativePath: string): string {
  const resolved = path.resolve(baseDir, relativePath);
  return normalizePath(resolved);
}
