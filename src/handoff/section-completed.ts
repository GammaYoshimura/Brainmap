import fs from "node:fs";
import path from "node:path";
import { readCurrentState } from "./state-reader.js";

export function generateCompletedSection(targetDir: string): string {
  const handoffPath = path.join(targetDir, ".brain", "handoff.md");
  if (fs.existsSync(handoffPath)) {
    const handoffRaw = fs.readFileSync(handoffPath, "utf8");
    const completedMatch = handoffRaw.match(/### COMPLETED\s*\r?\n([\s\S]*?)(?=\r?\n### |\n## |$)/i);
    if (completedMatch && completedMatch[1].trim()) {
      return `### COMPLETED\n${completedMatch[1].trim()}\n`;
    }
  }

  const state = readCurrentState(targetDir);
  if (state?.implementedRaw) {
    return `### COMPLETED\n${state.implementedRaw}\n`;
  }

  return "### COMPLETED\n- Initial repository setup.\n";
}
