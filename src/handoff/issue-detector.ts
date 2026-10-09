import fs from "node:fs";
import path from "node:path";
import { readCurrentState } from "./state-reader.js";

export interface OpenIssuesSummary {
  issues: string[];
  rawText?: string;
  hasBlockers: boolean;
}

export function detectOpenIssues(targetDir: string): OpenIssuesSummary {
  const issues: string[] = [];

  const handoffPath = path.join(targetDir, ".brain", "handoff.md");
  if (fs.existsSync(handoffPath)) {
    const rawHandoff = fs.readFileSync(handoffPath, "utf8");
    const issuesMatch = rawHandoff.match(/### OPEN ISSUES\s*\r?\n([\s\S]*?)(?=\r?\n### |\n## |$)/i);
    if (issuesMatch && issuesMatch[1].trim()) {
      const sectionText = issuesMatch[1].trim();
      const lines = sectionText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.startsWith("-") || l.startsWith("*"));

      for (const line of lines) {
        const text = line.replace(/^[-*]\s*/, "").trim();
        if (text && !/^none\.?$/i.test(text)) {
          issues.push(text);
        }
      }
    }
  }

  const state = readCurrentState(targetDir);
  if (state?.knownBlockersRaw) {
    const rawBlockers = state.knownBlockersRaw;
    const lines = rawBlockers
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith("-") || l.startsWith("*"));

    for (const line of lines) {
      const text = line.replace(/^[-*]\s*/, "").trim();
      if (text && !/^none\.?$/i.test(text) && !issues.includes(text)) {
        issues.push(text);
      }
    }
  }

  return {
    issues,
    rawText: issues.length > 0 ? issues.map((i) => `- ${i}`).join("\n") : "- None.",
    hasBlockers: issues.length > 0,
  };
}
