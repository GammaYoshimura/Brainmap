import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readCurrentState } from "../src/handoff/state-reader.js";
import { readCurrentMilestone } from "../src/handoff/milestone-reader.js";
import { detectRecentChanges } from "../src/handoff/change-detector.js";
import { detectChangedFiles } from "../src/handoff/file-change-detector.js";
import { readAvailableTestStatus } from "../src/handoff/test-status-reader.js";
import { detectOpenIssues } from "../src/handoff/issue-detector.js";
import { generateCurrentMilestoneSection } from "../src/handoff/section-current-milestone.js";

test("readCurrentState returns null when .brain/state.md does not exist", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-state-none-"));
  try {
    const result = readCurrentState(tmpDir);
    assert.equal(result, null);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("readCurrentState parses sections correctly when state.md exists", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-state-test-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  const mockState = `# Project State

## Current Milestone

**M146**: Read current state.

## What is Implemented

- Core foundation

## What is In Progress

- Implementing handoff reading

## Known Blockers

- None

## Relevant Current Conditions

- Passing test suite

## Immediate Next Work

- M147: Read current milestone
`;

  fs.writeFileSync(path.join(brainDir, "state.md"), mockState, "utf8");

  try {
    const result = readCurrentState(tmpDir);
    assert.ok(result);
    assert.equal(result.currentMilestoneRaw, "**M146**: Read current state.");
    assert.equal(result.implementedRaw, "- Core foundation");
    assert.equal(result.inProgressRaw, "- Implementing handoff reading");
    assert.equal(result.knownBlockersRaw, "- None");
    assert.equal(result.currentConditionsRaw, "- Passing test suite");
    assert.equal(result.immediateNextWorkRaw, "- M147: Read current milestone");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("readCurrentMilestone extracts code and title from formatted milestone string", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-milestone-test-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(path.join(brainDir, "state.md"), "# Project State\n\n## Current Milestone\n\n**M147**: Read current milestone.\n", "utf8");

  try {
    const milestone = readCurrentMilestone(tmpDir);
    assert.ok(milestone);
    assert.equal(milestone.code, "M147");
    assert.equal(milestone.title, "Read current milestone.");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("readCurrentMilestone returns null when state is missing", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-milestone-none-"));
  try {
    const milestone = readCurrentMilestone(tmpDir);
    assert.equal(milestone, null);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("detectRecentChanges detects git commits when run in a valid repo", () => {
  const changes = detectRecentChanges(process.cwd(), 3);
  assert.equal(changes.hasGit, true);
  assert.ok(changes.recentCommits.length > 0);
  assert.ok(changes.commitHash);
  assert.ok(changes.commitMessage);
});

test("detectRecentChanges handles non-git directories gracefully", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-nogit-"));
  try {
    const changes = detectRecentChanges(tmpDir, 3);
    assert.equal(changes.hasGit, false);
    assert.equal(changes.recentCommits.length, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("detectChangedFiles returns committed files from latest commit in git repo", () => {
  const result = detectChangedFiles(process.cwd());
  assert.equal(result.hasGit, true);
  assert.ok(Array.isArray(result.committedInLastCommit));
  assert.ok(Array.isArray(result.allCurrentChanges));
});

test("detectChangedFiles handles non-git directories gracefully", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-nogit-files-"));
  try {
    const result = detectChangedFiles(tmpDir);
    assert.equal(result.hasGit, false);
    assert.deepEqual(result.allCurrentChanges, []);
    assert.deepEqual(result.committedInLastCommit, []);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("readAvailableTestStatus parses passing test count from existing handoff document", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-tests-status-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(path.join(brainDir, "handoff.md"), "# Handoff\n\n### TEST STATUS\n- 171/171 tests passing (`npm test`).\n- TypeScript builds cleanly.\n", "utf8");

  try {
    const status = readAvailableTestStatus(tmpDir);
    assert.equal(status.status, "passing");
    assert.equal(status.testCount, 171);
    assert.equal(status.failingCount, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("readAvailableTestStatus returns unknown when no handoff or state exists", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-tests-none-"));
  try {
    const status = readAvailableTestStatus(tmpDir);
    assert.equal(status.status, "unknown");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("detectOpenIssues extracts blockers and ignores None entries", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-issues-test-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(path.join(brainDir, "handoff.md"), "# Handoff\n\n### OPEN ISSUES\n- None.\n", "utf8");
  fs.writeFileSync(path.join(brainDir, "state.md"), "# State\n\n## Known Blockers\n- Flaky network test on CI\n", "utf8");

  try {
    const issues = detectOpenIssues(tmpDir);
    assert.equal(issues.hasBlockers, true);
    assert.deepEqual(issues.issues, ["Flaky network test on CI"]);
    assert.equal(issues.rawText, "- Flaky network test on CI");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("detectOpenIssues returns clean fallback when no issues exist", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-issues-clean-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(path.join(brainDir, "handoff.md"), "# Handoff\n\n### OPEN ISSUES\n- None.\n", "utf8");
  fs.writeFileSync(path.join(brainDir, "state.md"), "# State\n\n## Known Blockers\n- None.\n", "utf8");

  try {
    const issues = detectOpenIssues(tmpDir);
    assert.equal(issues.hasBlockers, false);
    assert.deepEqual(issues.issues, []);
    assert.equal(issues.rawText, "- None.");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("generateCurrentMilestoneSection formats milestone header and item", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-sec-milestone-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(path.join(brainDir, "state.md"), "# State\n\n## Current Milestone\n\n**M152**: Generate CURRENT MILESTONE.\n", "utf8");

  try {
    const text = generateCurrentMilestoneSection(tmpDir);
    assert.equal(text, "### CURRENT MILESTONE\nM152: Generate CURRENT MILESTONE.\n");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
