import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readCurrentState } from "../src/handoff/state-reader.js";

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
