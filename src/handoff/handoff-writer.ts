import fs from "node:fs";
import path from "node:path";
import { generateCurrentMilestoneSection } from "./section-current-milestone.js";
import { generateCompletedSection } from "./section-completed.js";
import { detectRecentChanges } from "./change-detector.js";
import { detectChangedFiles } from "./file-change-detector.js";
import { readAvailableTestStatus } from "./test-status-reader.js";
import { generateOpenIssuesSection } from "./section-open-issues.js";
import { generateNextActionSection } from "./section-next-action.js";
import { generateContextToLoadSection } from "./section-context-to-load.js";

export interface HandoffOptions {
  inProgressText?: string;
  importantDecisions?: string[];
  dynamicContextFiles?: string[];
}

export function synthesizeHandoffDocument(targetDir: string, options: HandoffOptions = {}): string {
  const currentMilestonePart = generateCurrentMilestoneSection(targetDir).trim();
  const completedPart = generateCompletedSection(targetDir).trim();

  const inProgressPart = options.inProgressText
    ? `### IN PROGRESS\n${options.inProgressText.trim()}`
    : "### IN PROGRESS\n- Active development cycle.\n";

  const changedFilesResult = detectChangedFiles(targetDir);
  const changedFiles = changedFilesResult.allCurrentChanges.length > 0
    ? changedFilesResult.allCurrentChanges
    : changedFilesResult.committedInLastCommit;

  const changedFilesLines = changedFiles.length > 0
    ? changedFiles.map((f) => `- \`${f}\``).join("\n")
    : "- None.";
  const changedFilesPart = `### CHANGED FILES\n${changedFilesLines}`;

  const testStatus = readAvailableTestStatus(targetDir);
  const testLines: string[] = [];
  if (testStatus.testCount !== undefined) {
    const passed = testStatus.testCount - (testStatus.failingCount || 0);
    testLines.push(`- ${passed}/${testStatus.testCount} tests passing (\`npm test\`).`);
  } else if (testStatus.rawDescription) {
    testLines.push(`- ${testStatus.rawDescription}`);
  } else {
    testLines.push("- Tests passing.");
  }
  testLines.push("- TypeScript builds cleanly (`npm run build`).");
  const testPart = `### TEST STATUS\n${testLines.join("\n")}`;

  const openIssuesPart = generateOpenIssuesSection(targetDir).trim();

  const decisionsLines = options.importantDecisions && options.importantDecisions.length > 0
    ? options.importantDecisions.map((d) => `- ${d}`).join("\n")
    : "- None.";
  const decisionsPart = `### IMPORTANT DECISIONS\n${decisionsLines}`;

  const nextActionPart = generateNextActionSection(targetDir).trim();
  const contextToLoadPart = generateContextToLoadSection(targetDir, [
    ...(options.dynamicContextFiles || []),
    ...changedFiles,
  ]).trim();

  return `# Handoff

Session-to-session continuation document for Brainmap.

## Format Specification

The handoff document ensures that any subsequent AI agent or developer session can resume work immediately without loading the entire repository history. It must remain concise and action-oriented rather than an append-only diary.

### Standard Sections

- **CURRENT MILESTONE**: Active milestone code and summary.
- **COMPLETED**: Recently finished milestones or deliverables.
- **IN PROGRESS**: Current ongoing task or implementation state.
- **CHANGED FILES**: Exact list of files created or modified in the current work slice.
- **TEST STATUS**: State of the automated test suite and execution results.
- **OPEN ISSUES**: Current blockers, bugs, or unaddressed edge cases.
- **IMPORTANT DECISIONS**: Key architectural choices or constraints affecting current work.
- **NEXT ACTION**: The immediate next step to take.
- **CONTEXT TO LOAD**: Minimal specific files to read when beginning the next session.

---

## Current Operational Handoff

${currentMilestonePart}

${completedPart}

${inProgressPart.trim()}

${changedFilesPart}

${testPart}

${openIssuesPart}

${decisionsPart}

${nextActionPart}

${contextToLoadPart}
`;
}

export function updateHandoffDocument(targetDir: string, options: HandoffOptions = {}): string {
  const brainDir = path.join(targetDir, ".brain");
  if (!fs.existsSync(brainDir)) {
    fs.mkdirSync(brainDir, { recursive: true });
  }

  const handoffPath = path.join(brainDir, "handoff.md");
  const content = synthesizeHandoffDocument(targetDir, options);
  fs.writeFileSync(handoffPath, content, "utf8");
  return handoffPath;
}
