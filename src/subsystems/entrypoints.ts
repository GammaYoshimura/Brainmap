import path from "node:path";
import { SubsystemGrouping } from "./groupings.js";
import { normalizePath } from "../core/paths.js";
import { inferEntryPointKind } from "../mapper/entrypoint-map.js";
import { isEntryPoint } from "../detector/entrypoints.js";

/**
 * Representation of a detected entry point or interface boundary in a subsystem.
 */
export interface SubsystemEntryPoint {
  relativePath: string;
  name: string;
  kind: string;
  description: string;
}

/**
 * Subsystem facade filenames.
 */
const FACADE_NAMES = new Set([
  "index",
  "mod",
  "lib",
  "__init__",
  "main",
]);

/**
 * Identifies and records entry points and boundary interfaces for a subsystem.
 */
export function recordSubsystemEntryPoints(
  grouping: SubsystemGrouping
): SubsystemEntryPoint[] {
  const results: SubsystemEntryPoint[] = [];
  const seenPaths = new Set<string>();

  for (const file of grouping.files) {
    const normPath = normalizePath(file.relativePath);
    const ext = path.extname(file.name);
    const baseWithoutExt = path.basename(file.name, ext).toLowerCase();

    // 1. Explicit entry point (cli, server, app, etc.)
    if (file.isEntrypoint || isEntryPoint(file.relativePath)) {
      if (!seenPaths.has(normPath)) {
        seenPaths.add(normPath);
        const inferred = inferEntryPointKind(file.name, file.relativePath);
        results.push({
          relativePath: normPath,
          name: file.name,
          kind: inferred.kind,
          description: inferred.description,
        });
      }
      continue;
    }

    // 2. Facade / Root module export
    if (FACADE_NAMES.has(baseWithoutExt)) {
      if (!seenPaths.has(normPath)) {
        seenPaths.add(normPath);
        results.push({
          relativePath: normPath,
          name: file.name,
          kind: "facade",
          description: "Subsystem public export facade",
        });
      }
      continue;
    }

    // 3. Command or handler dispatchers
    if (
      normPath.includes("/commands/") ||
      normPath.includes("/handlers/") ||
      normPath.includes("/controllers/") ||
      normPath.includes("/routes/")
    ) {
      if (!seenPaths.has(normPath)) {
        seenPaths.add(normPath);
        results.push({
          relativePath: normPath,
          name: file.name,
          kind: "handler",
          description: "Subsystem command or route handler",
        });
      }
    }
  }

  // Sort by entry kind, then path
  return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/**
 * Formats subsystem entry points into Markdown lines.
 */
export function formatSubsystemEntryPoints(entryPoints: SubsystemEntryPoint[]): string[] {
  if (entryPoints.length === 0) {
    return ["_No dedicated entry points detected in this subsystem._"];
  }

  return entryPoints.map((ep) => {
    return `- \`${ep.relativePath}\` [${ep.kind}] — ${ep.description}`;
  });
}
