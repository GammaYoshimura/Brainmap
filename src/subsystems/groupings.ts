import path from "node:path";
import { FileModel, DirectoryModel, ProjectModel } from "../core/model.js";
import { normalizePath } from "../core/paths.js";

/**
 * Represents a detected natural subsystem grouping in the project.
 */
export interface SubsystemGrouping {
  id: string;
  name: string;
  path: string;
  files: FileModel[];
  directories: DirectoryModel[];
  languages: string[];
  isEntryPointContainer: boolean;
  confidence: "high" | "medium" | "low";
  reason: string;
}

/**
 * Ignored directory names that never constitute a natural project subsystem.
 */
const NON_SUBSYSTEM_DIRS = new Set([
  ".git",
  ".brain",
  "node_modules",
  "dist",
  "build",
  "target",
  "coverage",
  ".vscode",
  ".idea",
  "vendor",
]);

/**
 * Standard container directory prefixes that house natural subsystems.
 */
const CONTAINER_PREFIXES = [
  "src/",
  "lib/",
  "packages/",
  "apps/",
  "services/",
  "modules/",
  "pkg/",
  "internal/",
];

/**
 * Common top-level functional subsystem directory names.
 */
const TOP_LEVEL_FUNCTIONAL_DIRS = new Set([
  "frontend",
  "backend",
  "client",
  "server",
  "api",
  "cli",
  "cmd",
  "core",
  "web",
  "mobile",
  "desktop",
  "database",
  "services",
  "subsystems",
]);

/**
 * Helper to capitalize and format a subsystem title.
 */
function formatSubsystemName(rawName: string): string {
  const words = rawName
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  const formatted = words.join(" ");
  return formatted.toLowerCase().endsWith("subsystem")
    ? formatted
    : `${formatted} Subsystem`;
}

/**
 * Normalizes an identifier string for a subsystem.
 */
function formatSubsystemId(rawName: string): string {
  return rawName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Detects natural subsystem groupings from project files and directories.
 * Operates deterministically via structural analysis.
 */
export function detectNaturalSubsystemGroupings(
  files: FileModel[],
  directories: DirectoryModel[] = [],
  projectName?: string
): SubsystemGrouping[] {
  // Filter out files from non-subsystem directories
  const validFiles = files.filter((f) => {
    const norm = normalizePath(f.relativePath);
    return !Array.from(NON_SUBSYSTEM_DIRS).some((ns) => norm === ns || norm.startsWith(`${ns}/`));
  });

  if (validFiles.length === 0) {
    return [];
  }

  const validDirs = directories.filter((d) => {
    const norm = normalizePath(d.relativePath);
    return !Array.from(NON_SUBSYSTEM_DIRS).some((ns) => norm === ns || norm.startsWith(`${ns}/`));
  });

  const groupingsMap = new Map<string, {
    id: string;
    name: string;
    relPath: string;
    files: FileModel[];
    dirs: DirectoryModel[];
    confidence: "high" | "medium" | "low";
    reason: string;
  }>();

  // 1. Group by container directories (src/subsystem, packages/subsystem, etc.)
  for (const prefix of CONTAINER_PREFIXES) {
    const containerName = prefix.slice(0, -1);
    
    // Find all immediate children directories under container prefix
    const childDirs = new Set<string>();
    for (const d of validDirs) {
      const norm = normalizePath(d.relativePath);
      if (norm.startsWith(prefix) && norm.length > prefix.length) {
        const subName = norm.slice(prefix.length).split("/")[0];
        childDirs.add(subName);
      }
    }

    // Also check files directly in case directories list was partial
    for (const f of validFiles) {
      const norm = normalizePath(f.relativePath);
      if (norm.startsWith(prefix) && norm.length > prefix.length) {
        const subName = norm.slice(prefix.length).split("/")[0];
        if (norm.slice(prefix.length).includes("/")) {
          childDirs.add(subName);
        }
      }
    }

    for (const child of childDirs) {
      const fullSubPath = `${prefix}${child}`;
      const subFiles = validFiles.filter((f) => {
        const norm = normalizePath(f.relativePath);
        return norm === fullSubPath || norm.startsWith(`${fullSubPath}/`);
      });

      if (subFiles.length > 0) {
        const subDirs = validDirs.filter((d) => {
          const norm = normalizePath(d.relativePath);
          return norm === fullSubPath || norm.startsWith(`${fullSubPath}/`);
        });

        const id = formatSubsystemId(child);
        groupingsMap.set(fullSubPath, {
          id,
          name: formatSubsystemName(child),
          relPath: fullSubPath,
          files: subFiles,
          dirs: subDirs,
          confidence: "high",
          reason: `Dedicated source component under ${containerName}/`,
        });
      }
    }

    // Check if the container has top-level files directly under it (e.g. src/cli.ts, src/index.ts)
    const directContainerFiles = validFiles.filter((f) => {
      const norm = normalizePath(f.relativePath);
      if (norm.startsWith(prefix)) {
        const rest = norm.slice(prefix.length);
        return !rest.includes("/");
      }
      return false;
    });

    if (directContainerFiles.length > 0) {
      const hasEntryPoint = directContainerFiles.some((f) => f.isEntrypoint);
      const subId = hasEntryPoint ? "cli" : formatSubsystemId(containerName);
      const subName = hasEntryPoint ? "CLI Subsystem" : formatSubsystemName(containerName);

      groupingsMap.set(containerName, {
        id: subId,
        name: subName,
        relPath: containerName,
        files: directContainerFiles,
        dirs: [],
        confidence: "medium",
        reason: hasEntryPoint
          ? `Top-level entry points and CLI dispatchers in ${containerName}/`
          : `Top-level components in ${containerName}/`,
      });
    }
  }

  // 2. Group by top-level functional directories outside container prefixes (frontend/, backend/, api/, etc.)
  for (const d of validDirs) {
    const norm = normalizePath(d.relativePath);
    if (!norm.includes("/")) {
      if (TOP_LEVEL_FUNCTIONAL_DIRS.has(norm.toLowerCase())) {
        const subFiles = validFiles.filter((f) => {
          const fn = normalizePath(f.relativePath);
          return fn === norm || fn.startsWith(`${norm}/`);
        });

        if (subFiles.length > 0 && !groupingsMap.has(norm)) {
          const subDirs = validDirs.filter((vd) => {
            const dn = normalizePath(vd.relativePath);
            return dn === norm || dn.startsWith(`${norm}/`);
          });

          groupingsMap.set(norm, {
            id: formatSubsystemId(norm),
            name: formatSubsystemName(norm),
            relPath: norm,
            files: subFiles,
            dirs: subDirs,
            confidence: "high",
            reason: `Top-level architectural domain directory ${norm}/`,
          });
        }
      }
    }
  }

  // 3. Fallback: If no structured subsystems were discovered
  if (groupingsMap.size === 0) {
    // If there are top-level directories containing files
    const topDirs = new Set<string>();
    for (const f of validFiles) {
      const norm = normalizePath(f.relativePath);
      if (norm.includes("/")) {
        topDirs.add(norm.split("/")[0]);
      }
    }

    for (const td of topDirs) {
      const subFiles = validFiles.filter((f) => {
        const fn = normalizePath(f.relativePath);
        return fn === td || fn.startsWith(`${td}/`);
      });

      if (subFiles.length > 0) {
        groupingsMap.set(td, {
          id: formatSubsystemId(td),
          name: formatSubsystemName(td),
          relPath: td,
          files: subFiles,
          dirs: validDirs.filter((d) => normalizePath(d.relativePath).startsWith(`${td}/`)),
          confidence: "medium",
          reason: `Top-level directory grouping ${td}/`,
        });
      }
    }
  }

  // 4. Ultimate fallback: All files in flat root or single group
  if (groupingsMap.size === 0 && validFiles.length > 0) {
    const rootName = projectName ? formatSubsystemName(projectName) : "Core Subsystem";
    const rootId = projectName ? formatSubsystemId(projectName) : "core";
    groupingsMap.set(".", {
      id: rootId,
      name: rootName,
      relPath: ".",
      files: validFiles,
      dirs: validDirs,
      confidence: "low",
      reason: "Root project source grouping",
    });
  }

  // Convert to SubsystemGrouping array
  const result: SubsystemGrouping[] = [];

  for (const entry of groupingsMap.values()) {
    const languages = Array.from(
      new Set(
        entry.files
          .map((f) => f.language)
          .filter((l): l is string => Boolean(l))
      )
    ).sort();

    const isEntryPointContainer = entry.files.some((f) => Boolean(f.isEntrypoint));

    result.push({
      id: entry.id,
      name: entry.name,
      path: entry.relPath,
      files: entry.files,
      directories: entry.dirs,
      languages,
      isEntryPointContainer,
      confidence: entry.confidence,
      reason: entry.reason,
    });
  }

  return result.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Detects natural subsystem groupings directly from a ProjectModel.
 */
export function detectSubsystemGroupingsFromProject(project: ProjectModel): SubsystemGrouping[] {
  return detectNaturalSubsystemGroupings(
    project.files,
    project.directories,
    project.name
  );
}
