import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "../core/paths.js";

export interface SubsystemRoutingIssue {
  subsystemId: string;
  issue: "missing_directory" | "missing_index" | "unregistered_in_global_index" | "dangling_global_link";
  details: string;
}

export function detectSubsystemRoutingProblems(
  targetDir: string,
  brainDir: string = path.join(targetDir, ".brain")
): SubsystemRoutingIssue[] {
  const issues: SubsystemRoutingIssue[] = [];
  const subsystemsDir = path.join(brainDir, "subsystems");
  const globalIndexPath = path.join(brainDir, "index.md");

  let globalIndexContent = "";
  if (fs.existsSync(globalIndexPath)) {
    globalIndexContent = fs.readFileSync(globalIndexPath, "utf8");
  }

  // 1. If subsystems directory exists, check each entry
  if (fs.existsSync(subsystemsDir)) {
    const entries = fs.readdirSync(subsystemsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subId = entry.name;
        const indexPath = path.join(subsystemsDir, subId, "index.md");
        if (!fs.existsSync(indexPath)) {
          issues.push({
            subsystemId: subId,
            issue: "missing_index",
            details: `Subsystem '${subId}' is missing an index.md file.`,
          });
        }

        // Check if referenced in global index
        const expectedLink = `subsystems/${subId}/index.md`;
        const expectedAlt = `subsystems/${subId}`;
        if (
          globalIndexContent &&
          !globalIndexContent.includes(expectedLink) &&
          !globalIndexContent.includes(expectedAlt)
        ) {
          issues.push({
            subsystemId: subId,
            issue: "unregistered_in_global_index",
            details: `Subsystem '${subId}' exists on disk but is not linked in .brain/index.md.`,
          });
        }
      }
    }
  }

  // 2. Check global index for links pointing to non-existent subsystems
  if (globalIndexContent) {
    const linkRegex = /\[([^\]]+)\]\((subsystems\/([^\/]+)(?:\/index\.md)?)\)/g;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(globalIndexContent)) !== null) {
      const subId = match[3];
      if (subId === "index.md") continue;
      const targetSubDir = path.join(subsystemsDir, subId);
      if (!fs.existsSync(targetSubDir)) {
        issues.push({
          subsystemId: subId,
          issue: "dangling_global_link",
          details: `Global index links to subsystem '${subId}', but directory .brain/subsystems/${subId} does not exist.`,
        });
      }
    }
  }

  return issues;
}
