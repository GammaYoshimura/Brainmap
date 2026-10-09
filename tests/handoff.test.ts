import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readCurrentState } from "../src/handoff/state-reader.js";
import { readCurrentMilestone } from "../src/handoff/milestone-reader.js";
import { detectRecentChanges } from "../src/handoff/change-detector.js";

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
