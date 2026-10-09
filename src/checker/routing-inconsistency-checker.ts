import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "../core/paths.js";

export interface RoutingInconsistencyIssue {
  type: "missing_core_doc" | "missing_core_route" | "circular_reference";
  file: string;
  details: string;
}

export function detectBasicRoutingInconsistencies(
  targetDir: string,
  brainDir: string = path.join(targetDir, ".brain")
): RoutingInconsistencyIssue[] {
  const issues: RoutingInconsistencyIssue[] = [];
  if (!fs.existsSync(brainDir)) {
    return issues;
  }

  // 1. Core documents required by constitution
  const requiredCoreDocs = ["index.md", "architecture.md", "state.md", "handoff.md"];
  for (const doc of requiredCoreDocs) {
    if (!fs.existsSync(path.join(brainDir, doc))) {
      issues.push({
        type: "missing_core_doc",
        file: `.brain/${doc}`,
        details: `Required core constitution file .brain/${doc} is missing.`,
      });
    }
  }

  // 2. Global index must route to the core documents
  const globalIndexPath = path.join(brainDir, "index.md");
  if (fs.existsSync(globalIndexPath)) {
    const globalContent = fs.readFileSync(globalIndexPath, "utf8");
    const requiredLinks = ["architecture.md", "state.md", "handoff.md"];
    for (const link of requiredLinks) {
      if (!globalContent.includes(link)) {
        issues.push({
          type: "missing_core_route",
          file: ".brain/index.md",
          details: `Global router .brain/index.md does not contain a link to ${link}.`,
        });
      }
    }

    // Check circular references (e.g., index.md linking to index.md)
    if (/\[.*?\]\((?:\.\/)?index\.md\)/.test(globalContent)) {
      issues.push({
        type: "circular_reference",
        file: ".brain/index.md",
        details: "Global router .brain/index.md contains a circular self-reference to index.md.",
      });
    }
  }

  return issues;
}
