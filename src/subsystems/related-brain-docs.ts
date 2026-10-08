import fs from "node:fs";
import path from "node:path";
import { BrainDocumentModel } from "../core/model.js";
import { normalizePath } from "../core/paths.js";

/**
 * Reference to a related Brain document for a subsystem.
 */
export interface RelatedBrainDocRef {
  name: string;
  path: string;
  role: "constitution" | "router" | "decision" | "specialized" | "map";
  description?: string;
}

/**
 * Discovers and records all relevant Brain documents for a given subsystem.
 * Inspects root Brain constitution, routing, ADRs, and specialized subsystem files.
 */
export function recordRelatedBrainDocuments(
  subsystemId: string,
  brainDir?: string,
  brainDocuments: BrainDocumentModel[] = []
): RelatedBrainDocRef[] {
  const results: RelatedBrainDocRef[] = [];
  const seenPaths = new Set<string>();

  // 1. Standard root Brain documents (relative from .brain/subsystems/<subsystemId>/)
  results.push({
    name: "Architecture Constitution",
    path: "../../architecture.md",
    role: "constitution",
    description: "Global architectural constitution and invariants",
  });
  seenPaths.add("../../architecture.md");

  results.push({
    name: "Global Index",
    path: "../../index.md",
    role: "router",
    description: "Global knowledge and context router",
  });
  seenPaths.add("../../index.md");

  // Check if project map exists
  if (brainDir) {
    const projectMapPath = path.join(brainDir, "project-map.md");
    if (fs.existsSync(projectMapPath)) {
      results.push({
        name: "Project Map",
        path: "../../project-map.md",
        role: "map",
        description: "Generated project structural map",
      });
      seenPaths.add("../../project-map.md");
    }

    // Check master subsystems index
    const subsystemsMasterIndexPath = path.join(brainDir, "subsystems", "index.md");
    if (fs.existsSync(subsystemsMasterIndexPath)) {
      results.push({
        name: "Subsystems Master Index",
        path: "../index.md",
        role: "router",
        description: "Index of all registered project subsystems",
      });
      seenPaths.add("../index.md");
    }

    // Check specialized files in .brain/subsystems/<subsystemId>/
    const subFolder = path.join(brainDir, "subsystems", subsystemId);
    if (fs.existsSync(subFolder) && fs.statSync(subFolder).isDirectory()) {
      const entries = fs.readdirSync(subFolder);
      for (const entry of entries) {
        if (entry.endsWith(".md") && entry !== "index.md") {
          const relPath = entry; // local to the subsystem directory
          if (!seenPaths.has(relPath)) {
            seenPaths.add(relPath);
            results.push({
              name: entry,
              path: relPath,
              role: "specialized",
              description: `Subsystem specialized documentation (${entry})`,
            });
          }
        }
      }
    }

    // Check relevant ADRs in .brain/decisions/
    const decisionsDir = path.join(brainDir, "decisions");
    if (fs.existsSync(decisionsDir) && fs.statSync(decisionsDir).isDirectory()) {
      const adrFiles = fs.readdirSync(decisionsDir);
      const subIdLower = subsystemId.toLowerCase();

      for (const adrFile of adrFiles) {
        if (adrFile.endsWith(".md")) {
          const fullAdrPath = path.join(decisionsDir, adrFile);
          try {
            const content = fs.readFileSync(fullAdrPath, "utf8");
            const lowerContent = content.toLowerCase();
            const lowerFilename = adrFile.toLowerCase();

            // Match if ADR filename or content mentions this subsystem
            if (lowerFilename.includes(subIdLower) || lowerContent.includes(subIdLower)) {
              // Extract ADR title if present (first line starting with #)
              const firstLine = content.split("\n").find((l) => l.startsWith("# "));
              const title = firstLine ? firstLine.replace(/^#\s+/, "").trim() : adrFile;
              const relLink = `../../decisions/${adrFile}`;

              if (!seenPaths.has(relLink)) {
                seenPaths.add(relLink);
                results.push({
                  name: title,
                  path: relLink,
                  role: "decision",
                  description: "Architectural Decision Record impacting this subsystem",
                });
              }
            }
          } catch {
            // ignore unreadable ADR
          }
        }
      }
    }
  }

  // 2. Incorporate any in-memory BrainDocumentModel matching this subsystem
  for (const doc of brainDocuments) {
    if (doc.role === "decision") {
      const titleLower = doc.title.toLowerCase();
      if (titleLower.includes(subsystemId.toLowerCase())) {
        const link = `../../${normalizePath(doc.relativePath)}`;
        if (!seenPaths.has(link)) {
          seenPaths.add(link);
          results.push({
            name: doc.title,
            path: link,
            role: "decision",
            description: "Architectural Decision Record impacting this subsystem",
          });
        }
      }
    }
  }

  return results;
}

/**
 * Formats related Brain documents into Markdown bullet points.
 */
export function formatRelatedBrainDocuments(docs: RelatedBrainDocRef[]): string[] {
  if (docs.length === 0) {
    return [
      "- [Architecture Constitution](../../architecture.md)",
      "- [Global Routing](../../index.md)",
    ];
  }

  return docs.map((d) => {
    const desc = d.description ? ` — ${d.description}` : "";
    return `- [${d.name}](${normalizePath(d.path)}) [${d.role}]${desc}`;
  });
}
