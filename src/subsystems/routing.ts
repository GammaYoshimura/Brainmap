import fs from "node:fs";
import path from "node:path";
import { SubsystemGrouping } from "./groupings.js";
import { writeSubsystemsMasterIndex, SubsystemIndexData } from "./subsystem-index.js";
import { normalizePath } from "../core/paths.js";

/**
 * Ensures that all detected subsystems are properly routed in .brain/index.md.
 * Updates .brain/index.md deterministically without duplicating existing entries.
 */
export function ensureSubsystemRoutingInIndex(
  brainDir: string,
  subsystems: SubsystemGrouping[]
): boolean {
  const indexPath = path.join(brainDir, "index.md");
  if (!fs.existsSync(indexPath)) {
    return false;
  }

  let content = fs.readFileSync(indexPath, "utf8");
  let updated = false;

  for (const sub of subsystems) {
    const subRoutePattern = `subsystems/${sub.id}/`;
    if (!content.includes(subRoutePattern)) {
      const linkLine = `  - **[subsystems/${sub.id}/](subsystems/${sub.id}/)**: ${sub.name} routing and architectural context.`;

      // Check if subsystems/ parent entry exists
      const parentPattern = /-\s+\*\*\[subsystems\/\]\(subsystems\/\)\*\*:[^\n]*/;
      if (parentPattern.test(content)) {
        // Insert after the parent or after the last nested item
        const lastNestedPattern = new RegExp(`(-\\s+\\*\\*\\[subsystems\\/\\].*?(?:\\n\\s+-\\s+\\*\\*\\[subsystems\\/[^\\n]+)*)`, "s");
        const match = content.match(lastNestedPattern);
        if (match && match[0]) {
          content = content.replace(match[0], `${match[0]}\n${linkLine}`);
          updated = true;
        } else {
          content = content.replace(parentPattern, `$&\\n${linkLine}`);
          updated = true;
        }
      } else {
        // Subsystems section missing; add parent and child
        const block = `- **[subsystems/](subsystems/)**: Directory of subsystem-specific indexes, contracts, and specialized documentation.\n${linkLine}`;
        if (content.includes("## Root Brain Documents\n\n")) {
          content = content.replace("## Root Brain Documents\n\n", `## Root Brain Documents\n\n${block}\n`);
          updated = true;
        } else {
          content = `${content.trim()}\n\n${block}\n`;
          updated = true;
        }
      }
    }
  }

  if (updated) {
    fs.writeFileSync(indexPath, content, "utf8");
  }

  return updated;
}

/**
 * Generates or synchronizes the master subsystems index at .brain/subsystems/index.md.
 */
export function ensureSubsystemsMasterIndex(
  brainDir: string,
  subsystems: SubsystemGrouping[]
): string {
  const subsystemsDir = path.join(brainDir, "subsystems");
  if (!fs.existsSync(subsystemsDir)) {
    fs.mkdirSync(subsystemsDir, { recursive: true });
  }

  const indexDataList: SubsystemIndexData[] = subsystems.map((sub) => ({
    id: sub.id,
    name: sub.name,
    path: sub.path,
    description: `${sub.name} (${sub.confidence} confidence, ${sub.files.length} files)`,
  }));

  return writeSubsystemsMasterIndex(subsystemsDir, indexDataList);
}

/**
 * Synchronizes both .brain/index.md and .brain/subsystems/index.md with detected subsystems.
 */
export function syncSubsystemRouting(
  brainDir: string,
  subsystems: SubsystemGrouping[]
): { indexUpdated: boolean; masterIndexPath: string } {
  const indexUpdated = ensureSubsystemRoutingInIndex(brainDir, subsystems);
  const masterIndexPath = ensureSubsystemsMasterIndex(brainDir, subsystems);

  return {
    indexUpdated,
    masterIndexPath: normalizePath(masterIndexPath),
  };
}
