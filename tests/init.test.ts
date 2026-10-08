import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initCommand, INIT_SUCCESS, DEFAULT_INDEX_TEMPLATE, DEFAULT_ARCHITECTURE_TEMPLATE, DEFAULT_STATE_TEMPLATE, DEFAULT_HANDOFF_TEMPLATE } from "../src/commands/init.js";
import { validateBrainStructure } from "../src/core/brain-validator.js";

test("initCommand creates valid .brain structure in target directory", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-init-test-"));
  try {
    const code = initCommand([tmpDir]);
    assert.equal(code, INIT_SUCCESS);

    const validation = validateBrainStructure(tmpDir);
    assert.equal(validation.valid, true);
    assert.deepEqual(validation.missing, []);

    const indexPath = path.join(tmpDir, ".brain", "index.md");
    const archPath = path.join(tmpDir, ".brain", "architecture.md");
    const statePath = path.join(tmpDir, ".brain", "state.md");
    const handoffPath = path.join(tmpDir, ".brain", "handoff.md");

    assert.equal(fs.readFileSync(indexPath, "utf8"), DEFAULT_INDEX_TEMPLATE);
    assert.equal(fs.readFileSync(archPath, "utf8"), DEFAULT_ARCHITECTURE_TEMPLATE);
    assert.equal(fs.readFileSync(statePath, "utf8"), DEFAULT_STATE_TEMPLATE);
    assert.equal(fs.readFileSync(handoffPath, "utf8"), DEFAULT_HANDOFF_TEMPLATE);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("initCommand is idempotent and preserves existing customized files", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-init-idempotent-"));
  try {
    const codeFirst = initCommand([tmpDir]);
    assert.equal(codeFirst, INIT_SUCCESS);

    const customState = "# Custom State\n\nCustom content that must not be overwritten.\n";
    const statePath = path.join(tmpDir, ".brain", "state.md");
    fs.writeFileSync(statePath, customState, "utf8");

    const codeSecond = initCommand([tmpDir]);
    assert.equal(codeSecond, INIT_SUCCESS);

    assert.equal(fs.readFileSync(statePath, "utf8"), customState);
    const validation = validateBrainStructure(tmpDir);
    assert.equal(validation.valid, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
