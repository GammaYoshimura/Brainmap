import fs from "node:fs";
import path from "node:path";
import { normalizePath, toRelativePath } from "../core/paths.js";
import { SubsystemCandidate } from "./subsystem-matcher.js";
import { traverseProject, recordDiscoveredFiles, recordDiscoveredDirectories } from "../scanner/scanner.js";
import { detectNaturalSubsystemGroupings } from "../subsystems/groupings.js";

/**
 * Discovers available subsystems in a project.
 * First reads generated subsystem documentation from .brain/subsystems,
 * and falls back to natural grouping heuristics if not yet generated.
 */
export function discoverSubsystems(projectRoot: string): SubsystemCandidate[] {
  const brainSubsystemsDir = path.join(projectRoot, ".brain", "subsystems");
  const candidates: SubsystemCandidate[] = [];
  const seenIds = new Set<string>();

  if (fs.existsSync(brainSubsystemsDir) && fs.statSync(brainSubsystemsDir).isDirectory()) {
    const entries = fs.readdirSync(brainSubsystemsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subId = entry.name;
        const indexPath = path.join(brainSubsystemsDir, subId, "index.md");
        if (fs.existsSync(indexPath)) {
          const content = fs.readFileSync(indexPath, "utf8");
          const titleMatch = content.match(/^#\s+(.+)$/m);
          let name = titleMatch ? titleMatch[1].trim() : subId;
          if (name.toLowerCase().endsWith("subsystem")) {
            name = name.slice(0, -9).trim();
          }

          const locMatch = content.match(/- \*\*(?:Location|Source Path)\*\*:\s*`([^`]+)`/);
          const subPath = locMatch ? locMatch[1].trim() : subId;

          seenIds.add(subId);
          candidates.push({
            id: subId,
            name,
            path: subPath,
            docPath: toRelativePath(projectRoot, indexPath),
          });
        }
      }
    }

    // Also check master index .brain/subsystems/index.md for any entries
    const masterIndexPath = path.join(brainSubsystemsDir, "index.md");
    if (fs.existsSync(masterIndexPath)) {
      const content = fs.readFileSync(masterIndexPath, "utf8");
      const regex = /-\s+\*\*\[([^\]]+)\]\(([^)]+)\/index\.md\)\*\*\s+\(`([^`]+)`\)/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        let name = match[1].trim();
        if (name.toLowerCase().endsWith("subsystem")) {
          name = name.slice(0, -9).trim();
        }
        const subId = match[2].trim();
        const subPath = match[3].trim();
        if (!seenIds.has(subId)) {
          seenIds.add(subId);
          candidates.push({
            id: subId,
            name,
            path: subPath,
            docPath: `.brain/subsystems/${subId}/index.md`,
          });
        }
      }
    }
  }

  // Fallback: derive natural groupings if no subsystem documents exist
  if (candidates.length === 0) {
    try {
      const traversal = traverseProject(projectRoot);
      const files = recordDiscoveredFiles(traversal.files, traversal.rootPath);
      const dirs = recordDiscoveredDirectories(traversal.directories, traversal.rootPath, traversal.files);
      const groupings = detectNaturalSubsystemGroupings(files, dirs, path.basename(projectRoot));
      for (const g of groupings) {
        if (!seenIds.has(g.id)) {
          seenIds.add(g.id);
          candidates.push({
            id: g.id,
            name: g.name.toLowerCase().endsWith("subsystem") ? g.name.slice(0, -9).trim() : g.name,
            path: g.path,
            docPath: `.brain/subsystems/${g.id}/index.md`,
          });
        }
      }
    } catch {
      // Fallback failed gracefully
    }
  }

  return candidates.sort((a, b) => a.id.localeCompare(b.id));
}
