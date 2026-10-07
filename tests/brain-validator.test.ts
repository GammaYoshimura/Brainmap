import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateBrainStructure } from "../src/core/brain-validator.js";

test("validateBrainStructure passes on valid Brain directory", () => {
  const result = validateBrainStructure(process.cwd());
  assert.equal(result.valid, true);
  assert.deepEqual(result.missing, []);
});

test("validateBrainStructure fails when .brain is completely missing", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-test-"));
  try {
    const result = validateBrainStructure(tmpDir);
    assert.equal(result.valid, false);
    assert.deepEqual(result.missing, [".brain/"]);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("validateBrainStructure detects missing files inside .brain", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-test-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir);
  // Create only index.md
  fs.writeFileSync(path.join(brainDir, "index.md"), "# Index");
  try {
    const result = validateBrainStructure(tmpDir);
    assert.equal(result.valid, false);
    assert.ok(result.missing.includes(".brain/architecture.md"));
    assert.ok(result.missing.includes(".brain/state.md"));
    assert.ok(result.missing.includes(".brain/handoff.md"));
    assert.ok(result.missing.includes(".brain/decisions/"));
    assert.ok(result.missing.includes(".brain/subsystems/"));
    assert.ok(!result.missing.includes(".brain/index.md"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
