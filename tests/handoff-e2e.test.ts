import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run, EXIT_SUCCESS } from "../src/cli.js";
import { updateHandoffDocument, synthesizeHandoffDocument } from "../src/handoff/handoff-writer.js";
import { handoffCommand, HANDOFF_SUCCESS } from "../src/commands/handoff.js";

test("handoff end-to-end: synthesize and update creates complete standard markdown document", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-e2e-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(
    path.join(brainDir, "state.md"),
    `# Project State

## Current Milestone

**M158**: Add handoff tests.

## What is Implemented

- Foundation blocks M001–M157

## What is In Progress

- Verifying end-to-end handoff subsystem

## Known Blockers

- None.

## Relevant Current Conditions

- 181 passing tests

## Immediate Next Work

- Next block: Health Checks (M159).
`,
    "utf8"
  );

  try {
    const handoffPath = updateHandoffDocument(tmpDir, {
      inProgressText: "- Finalizing handoff test verification suite.",
      importantDecisions: ["Full deterministic handoff automation."],
    });

    assert.ok(fs.existsSync(handoffPath));
    const content = fs.readFileSync(handoffPath, "utf8");

    // Check all standard sections
    assert.ok(content.includes("### CURRENT MILESTONE"));
    assert.ok(content.includes("M158: Add handoff tests."));

    assert.ok(content.includes("### COMPLETED"));
    assert.ok(content.includes("Foundation blocks M001–M157"));

    assert.ok(content.includes("### IN PROGRESS"));
    assert.ok(content.includes("Finalizing handoff test verification suite."));

    assert.ok(content.includes("### CHANGED FILES"));

    assert.ok(content.includes("### TEST STATUS"));
    assert.ok(content.includes("181/181 tests passing (`npm test`)."));

    assert.ok(content.includes("### OPEN ISSUES"));
    assert.ok(content.includes("None."));

    assert.ok(content.includes("### IMPORTANT DECISIONS"));
    assert.ok(content.includes("Full deterministic handoff automation."));

    assert.ok(content.includes("### NEXT ACTION"));
    assert.ok(content.includes("Next block: Health Checks (M159)."));

    assert.ok(content.includes("### CONTEXT TO LOAD"));
    assert.ok(content.includes(".brain/index.md"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("handoffCommand runs successfully in target directory", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-handoff-cmd-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(
    path.join(brainDir, "state.md"),
    "# State\n\n## Current Milestone\n\n**M158**: Add handoff tests.\n",
    "utf8"
  );

  try {
    const code = handoffCommand([tmpDir]);
    assert.equal(code, HANDOFF_SUCCESS);
    assert.ok(fs.existsSync(path.join(brainDir, "handoff.md")));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("cli dispatches handoff command end-to-end", () => {
  const code = run(["handoff"]);
  assert.equal(code, EXIT_SUCCESS);
});
