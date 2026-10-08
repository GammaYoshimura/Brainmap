import path from "node:path";
import { normalizePath } from "../core/paths.js";
import { FileModel } from "../core/model.js";

export interface EntryPointRule {
  id: string;
  description: string;
  matches: (relPath: string) => boolean;
}

/**
 * Base entry point detection rules.
 */
export const DEFAULT_ENTRY_POINT_RULES: EntryPointRule[] = [
  {
    id: "root-or-src-main",
    description: "Main file at root or src directory",
    matches: (p) => /^(src\/)?main\.[a-z0-9]+$/i.test(p),
  },
  {
    id: "root-or-src-index",
    description: "Index file at root or src directory",
    matches: (p) => /^(src\/)?index\.[a-z0-9]+$/i.test(p),
  },
];

/**
 * Determines whether a file path corresponds to an entry point.
 */
export function isEntryPoint(
  filePath: string,
  customRules: EntryPointRule[] = []
): boolean {
  const normalized = normalizePath(filePath).replace(/^\.\//, "");
  const rules = [...customRules, ...DEFAULT_ENTRY_POINT_RULES];

  return rules.some((rule) => rule.matches(normalized));
}

/**
 * Filters a list of files to return only identified entry points.
 */
export function detectEntryPoints(
  files: (FileModel | string)[],
  customRules?: EntryPointRule[]
): string[] {
  return files
    .map((f) => (typeof f === "string" ? f : f.relativePath))
    .filter((relPath) => isEntryPoint(relPath, customRules));
}
