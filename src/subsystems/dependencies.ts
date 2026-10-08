import fs from "node:fs";
import path from "node:path";
import { SubsystemGrouping } from "./groupings.js";
import { DependencyModel } from "../core/model.js";
import { normalizePath } from "../core/paths.js";

/**
 * Representation of a dependency detected for a subsystem.
 */
export interface SubsystemDependencyRecord {
  name: string;
  kind: "internal-subsystem" | "external-package" | "runtime";
  target?: string;
  description?: string;
}

/**
 * Regex matching common import, require, and include statements across languages.
 * Handles TypeScript/JavaScript, Python, Go, Rust, C#, PHP, and Dart.
 */
const IMPORT_PATTERNS = [
  // JS/TS: import ... from "..." or require("...") or export ... from "..."
  /(?:import|export)\s+.*?from\s+['"]([^'"]+)['"]/g,
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // Python: from ... import ... or import ...
  /(?:from|import)\s+([a-zA-Z0-9_.]+)/g,
  // Go: import "..."
  /import\s+['"]([^'"]+)['"]/g,
  // Rust: use crate::...
  /use\s+crate::([a-zA-Z0-9_]+)/g,
  // C#: using ...;
  /using\s+([a-zA-Z0-9_.]+);/g,
  // Dart: import '...'
  /import\s+['"]([^'"]+)['"]/g,
  // PHP: use ...;
  /use\s+([a-zA-Z0-9_\\]+);/g,
];

/**
 * Identifies and records internal and external dependencies for a subsystem.
 */
export function recordSubsystemDependencies(
  grouping: SubsystemGrouping,
  allGroupings: SubsystemGrouping[] = [],
  declaredDependencies: DependencyModel[] = [],
  projectRoot?: string
): SubsystemDependencyRecord[] {
  const records: SubsystemDependencyRecord[] = [];
  const seenInternalTargets = new Set<string>();
  const seenExternalPkgs = new Set<string>();

  // Other subsystems map by id and path
  const otherSubsystems = allGroupings.filter((g) => g.id !== grouping.id);

  // Scan file contents for imports if files exist on disk
  for (const file of grouping.files) {
    let content = "";
    const fullPath = projectRoot
      ? path.resolve(projectRoot, file.relativePath)
      : file.path;

    try {
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        content = fs.readFileSync(fullPath, "utf8");
      }
    } catch {
      content = "";
    }

    if (!content) {
      continue;
    }

    // Match import statements
    for (const pattern of IMPORT_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        const importSpecifier = match[1];
        if (!importSpecifier) continue;

        const normSpecifier = normalizePath(importSpecifier).toLowerCase();

        // Check if import targets another internal subsystem
        for (const other of otherSubsystems) {
          const otherId = other.id.toLowerCase();
          const otherRelPath = normalizePath(other.path).toLowerCase();

          if (
            normSpecifier.includes(`/${otherId}/`) ||
            normSpecifier.endsWith(`/${otherId}`) ||
            normSpecifier.startsWith(`${otherId}/`) ||
            normSpecifier.includes(`/${otherRelPath}/`) ||
            normSpecifier.endsWith(`/${otherRelPath}`) ||
            normSpecifier === otherRelPath ||
            normSpecifier === otherId
          ) {
            if (!seenInternalTargets.has(other.id)) {
              seenInternalTargets.add(other.id);
              records.push({
                name: other.name,
                kind: "internal-subsystem",
                target: other.id,
                description: `Cross-subsystem dependency on \`${other.id}\``,
              });
            }
          }
        }

        // Check if import matches a declared external dependency
        for (const dep of declaredDependencies) {
          const depNameLower = dep.name.toLowerCase();
          if (
            normSpecifier === depNameLower ||
            normSpecifier.startsWith(`${depNameLower}/`)
          ) {
            if (!seenExternalPkgs.has(dep.name)) {
              seenExternalPkgs.add(dep.name);
              records.push({
                name: dep.name,
                kind: "external-package",
                target: dep.version,
                description: `Declared package dependency (${dep.kind})`,
              });
            }
          }
        }

        // Detect node built-in runtime modules
        if (normSpecifier.startsWith("node:")) {
          const modName = normSpecifier;
          if (!seenExternalPkgs.has(modName)) {
            seenExternalPkgs.add(modName);
            records.push({
              name: modName,
              kind: "runtime",
              description: "Node.js standard library runtime module",
            });
          }
        }
      }
    }
  }

  // Sort: internal first, then external, then runtime, then by name
  return records.sort((a, b) => {
    if (a.kind !== b.kind) {
      const order = { "internal-subsystem": 1, "external-package": 2, runtime: 3 };
      return (order[a.kind] || 99) - (order[b.kind] || 99);
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Formats subsystem dependency records into Markdown lines.
 */
export function formatSubsystemDependencies(records: SubsystemDependencyRecord[]): string[] {
  if (records.length === 0) {
    return ["_No external or internal subsystem dependencies detected._"];
  }

  return records.map((rec) => {
    const badge = `[${rec.kind}]`;
    const targetInfo = rec.target ? ` (\`${rec.target}\`)` : "";
    const desc = rec.description ? ` — ${rec.description}` : "";
    return `- **${rec.name}**${targetInfo} ${badge}${desc}`;
  });
}
