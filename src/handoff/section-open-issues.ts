import { detectOpenIssues } from "./issue-detector.js";

export function generateOpenIssuesSection(targetDir: string): string {
  const issues = detectOpenIssues(targetDir);
  return `### OPEN ISSUES\n${issues.rawText}\n`;
}
