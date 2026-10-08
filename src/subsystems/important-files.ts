import path from "node:path";
import { FileModel } from "../core/model.js";
import { SubsystemGrouping } from "./groupings.js";
import { normalizePath } from "../core/paths.js";

/**
 * Categorized role of an important file within a subsystem.
 */
export type ImportantFileRole =
  | "entry"
  | "index"
  | "domain-core"
  | "contracts"
  | "configuration"
  | "general";

/**
 * Representation of an important file within a subsystem.
 */
export interface ImportantSubsystemFile {
  relativePath: string;
  name: string;
  role: ImportantFileRole;
  reason: string;
  size: number;
}

/**
 * Known contract/types filenames.
 */
const CONTRACT_FILENAMES = new Set([
  "contracts",
  "contract",
  "types",
  "model",
  "models",
  "interfaces",
  "interface",
  "schema",
  "schemas",
  "entities",
  "entity",
]);

/**
 * Known index/facade filenames.
 */
const INDEX_FILENAMES = new Set([
  "index",
  "mod",
  "__init__",
  "lib",
  "main",
]);

/**
 * Known configuration/routing filenames.
 */
const CONFIG_FILENAMES = new Set([
  "config",
  "configuration",
  "settings",
  "routes",
  "router",
  "manifest",
  "options",
]);

/**
 * Identifies and scores important files within a subsystem grouping.
 * Prioritizes core domain logic, facades, contracts, and entry points.
 */
export function identifyImportantSubsystemFiles(
  grouping: SubsystemGrouping,
  maxFiles = 10
): ImportantSubsystemFile[] {
  const scoredFiles: Array<{
    file: FileModel;
    role: ImportantFileRole;
    reason: string;
    priority: number;
  }> = [];

  const subIdLower = grouping.id.toLowerCase();
  const subNameLower = grouping.name.toLowerCase().replace(/subsystem$/, "").trim();

  for (const file of grouping.files) {
    const ext = path.extname(file.name);
    const baseNameWithoutExt = path.basename(file.name, ext).toLowerCase();

    // 1. Dedicated entrypoint
    if (file.isEntrypoint) {
      scoredFiles.push({
        file,
        role: "entry",
        reason: "Executable entry point",
        priority: 100,
      });
      continue;
    }

    // 2. Core domain file matching subsystem identifier or name
    if (baseNameWithoutExt === subIdLower || baseNameWithoutExt === subNameLower) {
      scoredFiles.push({
        file,
        role: "domain-core",
        reason: "Core domain logic matching subsystem identifier",
        priority: 90,
      });
      continue;
    }

    // 3. Facade or root module export
    if (INDEX_FILENAMES.has(baseNameWithoutExt)) {
      scoredFiles.push({
        file,
        role: "index",
        reason: "Module export facade or root index",
        priority: 80,
      });
      continue;
    }

    // 4. Contracts and domain data models
    if (CONTRACT_FILENAMES.has(baseNameWithoutExt)) {
      scoredFiles.push({
        file,
        role: "contracts",
        reason: "Type definitions and domain contracts",
        priority: 70,
      });
      continue;
    }

    // 5. Configuration and routing
    if (CONFIG_FILENAMES.has(baseNameWithoutExt)) {
      scoredFiles.push({
        file,
        role: "configuration",
        reason: "Configuration or routing specifications",
        priority: 60,
      });
      continue;
    }

    // 6. General component
    scoredFiles.push({
      file,
      role: "general",
      reason: "Subsystem functional component",
      priority: Math.min(50, Math.floor(file.size / 100)),
    });
  }

  // Sort by priority descending, then by name alphabetically
  scoredFiles.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.file.name.localeCompare(b.file.name);
  });

  return scoredFiles.slice(0, maxFiles).map((item) => ({
    relativePath: normalizePath(item.file.relativePath),
    name: item.file.name,
    role: item.role,
    reason: item.reason,
    size: item.file.size,
  }));
}

/**
 * Formats a list of important subsystem files into Markdown items.
 */
export function formatImportantFiles(importantFiles: ImportantSubsystemFile[]): string[] {
  if (importantFiles.length === 0) {
    return ["_No files discovered._"];
  }

  return importantFiles.map((f) => {
    return `- \`${f.relativePath}\` (${f.role}) — ${f.reason}`;
  });
}
