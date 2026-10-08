import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  recordRelatedBrainDocuments,
  formatRelatedBrainDocuments
} from "../src/subsystems/related-brain-docs.js";

test("recordRelatedBrainDocuments links root constitution, router, and matches local specialized docs and ADRs", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-subsystem-related-"));

  try {
    const brainDir = path.join(tmpDir, ".brain");
    const subScannerDir = path.join(brainDir, "subsystems", "scanner");
    const decisionsDir = path.join(brainDir, "decisions");
    fs.mkdirSync(subScannerDir, { recursive: true });
    fs.mkdirSync(decisionsDir, { recursive: true });

    // Create specialized document in scanner
    fs.writeFileSync(path.join(subScannerDir, "exclusions.md"), "# Scanner Exclusions\n", "utf8");

    // Create an ADR impacting scanner
    const adrPath = path.join(decisionsDir, "0002-deterministic-scanner.md");
    fs.writeFileSync(
      adrPath,
      "# ADR 0002: Deterministic Scanner\n\nScanner subsystem architecture.\n",
      "utf8"
    );

    // Create project map in .brain
    fs.writeFileSync(path.join(brainDir, "project-map.md"), "# Project Map\n", "utf8");

    const related = recordRelatedBrainDocuments("scanner", brainDir);

    const names = related.map((r) => r.name);
    assert.ok(names.includes("Architecture Constitution"));
    assert.ok(names.includes("Global Index"));
    assert.ok(names.includes("Project Map"));
    assert.ok(names.includes("exclusions.md"));
    assert.ok(names.includes("ADR 0002: Deterministic Scanner"));

    const formatted = formatRelatedBrainDocuments(related);
    assert.ok(formatted.some((l) => l.includes("exclusions.md") && l.includes("[specialized]")));
    assert.ok(formatted.some((l) => l.includes("ADR 0002") && l.includes("[decision]")));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("formatRelatedBrainDocuments provides sensible fallback when empty", () => {
  const formatted = formatRelatedBrainDocuments([]);
  assert.equal(formatted.length, 2);
  assert.ok(formatted[0].includes("architecture.md"));
  assert.ok(formatted[1].includes("index.md"));
});
