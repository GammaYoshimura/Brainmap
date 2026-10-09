import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkReferencedDocumentExistence } from "../src/checker/doc-existence-checker.js";

test("checkReferencedDocumentExistence reports missing referenced markdown docs", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-check-doc-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(
    path.join(brainDir, "index.md"),
    "# Index\n- [Architecture](architecture.md)\n- [Missing Subsystem](subsystems/nonexistent.md)\n",
    "utf8"
  );
  fs.writeFileSync(path.join(brainDir, "architecture.md"), "# Architecture\n", "utf8");

  try {
    const issues = checkReferencedDocumentExistence(tmpDir, brainDir);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].referencedPath, "subsystems/nonexistent.md");
    assert.equal(issues[0].referencingFile, ".brain/index.md");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("checkReferencedDocumentExistence returns empty array when all referenced docs exist", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-check-doc-clean-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(
    path.join(brainDir, "index.md"),
    "# Index\n- [Architecture](architecture.md)\n- [Web link](https://example.com)\n- [Section](#header)\n",
    "utf8"
  );
  fs.writeFileSync(path.join(brainDir, "architecture.md"), "# Architecture\n", "utf8");

  try {
    const issues = checkReferencedDocumentExistence(tmpDir, brainDir);
    assert.equal(issues.length, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
