import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "../core/paths.js";

export function generateContextToLoadSection(targetDir: string, dynamicFiles: string[] = []): string {
  const contextFiles = new Set<string>();

  const standardBrainDocs = [
    ".brain/index.md",
    ".brain/state.md",
    ".brain/handoff.md",
  ];

  for (const doc of standardBrainDocs) {
    if (fs.existsSync(path.join(targetDir, doc))) {
      contextFiles.add(doc);
    }
  }

  for (const f of dynamicFiles) {
    const rel = normalizePath(path.isAbsolute(f) ? path.relative(targetDir, f) : f);
    if (!rel.startsWith(".git") && !rel.startsWith(".micro-brain") && !rel.includes("master_prompt")) {
      contextFiles.add(rel);
    }
  }

  const items = Array.from(contextFiles);
  if (items.length === 0) {
    return "### CONTEXT TO LOAD\n- .brain/index.md\n- .brain/state.md\n- .brain/handoff.md\n";
  }

  const lines = items.map((f) => `- ${f}`);
  return `### CONTEXT TO LOAD\n${lines.join("\n")}\n`;
}
