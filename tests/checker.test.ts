import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkReferencedDocumentExistence } from "../src/checker/doc-existence-checker.js";
import { detectBrokenMarkdownLinks } from "../src/checker/markdown-link-checker.js";
import { detectMissingSourceFileReferences } from "../src/checker/source-ref-checker.js";
import { detectSubsystemRoutingProblems } from "../src/checker/subsystem-routing-checker.js";
import { detectObviousDuplicateReferences } from "../src/checker/duplicate-ref-checker.js";
import { detectBasicRoutingInconsistencies } from "../src/checker/routing-inconsistency-checker.js";
import { detectUnreflectedMapChanges } from "../src/checker/map-sync-checker.js";
import { runHealthChecks, formatHealthReport } from "../src/checker/health-reporter.js";

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

test("detectBrokenMarkdownLinks detects missing anchor and missing file targets", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-check-links-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(
    path.join(brainDir, "index.md"),
    "# Brain Index\n\n- [Existing](#brain-index)\n- [Bad Anchor](#invalid-anchor)\n- [Bad File](docs/missing.md)\n",
    "utf8"
  );

  try {
    const broken = detectBrokenMarkdownLinks(tmpDir, brainDir);
    assert.equal(broken.length, 2);

    const anchorBroken = broken.find((b) => b.reason === "missing_anchor");
    assert.ok(anchorBroken);
    assert.equal(anchorBroken.target, "#invalid-anchor");

    const fileBroken = broken.find((b) => b.reason === "missing_file");
    assert.ok(fileBroken);
    assert.equal(fileBroken.target, "docs/missing.md");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("detectMissingSourceFileReferences identifies referenced non-existent code files", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-check-src-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(
    path.join(brainDir, "architecture.md"),
    "# Architecture\nUses `src/index.ts` and `src/nonexistent.ts`.\n",
    "utf8"
  );

  const srcDir = path.join(tmpDir, "src");
  fs.mkdirSync(srcDir, { recursive: true });
  fs.writeFileSync(path.join(srcDir, "index.ts"), "// main\n", "utf8");

  try {
    const missing = detectMissingSourceFileReferences(tmpDir, brainDir);
    assert.equal(missing.length, 1);
    assert.equal(missing[0].referencedFile, "src/nonexistent.ts");
    assert.equal(missing[0].documentFile, ".brain/architecture.md");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("detectSubsystemRoutingProblems catches missing index, unregistered subsystem, and dangling link", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-check-subsystems-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  // Subsystem with missing index
  const sub1Dir = path.join(brainDir, "subsystems", "auth");
  fs.mkdirSync(sub1Dir, { recursive: true });

  // Subsystem with index but not in global index
  const sub2Dir = path.join(brainDir, "subsystems", "payment");
  fs.mkdirSync(sub2Dir, { recursive: true });
  fs.writeFileSync(path.join(sub2Dir, "index.md"), "# Payment\n", "utf8");

  // Global index with dangling link
  fs.writeFileSync(
    path.join(brainDir, "index.md"),
    "# Global Index\n- [Dangling](subsystems/ghost/index.md)\n",
    "utf8"
  );

  try {
    const issues = detectSubsystemRoutingProblems(tmpDir, brainDir);
    assert.ok(issues.some((i) => i.issue === "missing_index" && i.subsystemId === "auth"));
    assert.ok(issues.some((i) => i.issue === "unregistered_in_global_index" && i.subsystemId === "payment"));
    assert.ok(issues.some((i) => i.issue === "dangling_global_link" && i.subsystemId === "ghost"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("detectObviousDuplicateReferences flags repeated links in same document", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-check-dup-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(
    path.join(brainDir, "index.md"),
    "# Index\n- [Architecture](architecture.md)\n- [Arch Again](architecture.md)\n- [State](state.md)\n",
    "utf8"
  );

  try {
    const dups = detectObviousDuplicateReferences(tmpDir, brainDir);
    assert.equal(dups.length, 1);
    assert.equal(dups[0].target, "architecture.md");
    assert.equal(dups[0].count, 2);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("detectBasicRoutingInconsistencies identifies missing core routes and self-references", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-check-inconsist-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  // Missing handoff.md file
  fs.writeFileSync(path.join(brainDir, "architecture.md"), "# Architecture\n", "utf8");
  fs.writeFileSync(path.join(brainDir, "state.md"), "# State\n", "utf8");

  // index.md linking to index.md and missing handoff link
  fs.writeFileSync(
    path.join(brainDir, "index.md"),
    "# Index\n- [Self](index.md)\n- [Arch](architecture.md)\n",
    "utf8"
  );

  try {
    const issues = detectBasicRoutingInconsistencies(tmpDir, brainDir);
    assert.ok(issues.some((i) => i.type === "missing_core_doc" && i.file === ".brain/handoff.md"));
    assert.ok(issues.some((i) => i.type === "missing_core_route" && i.details.includes("state.md")));
    assert.ok(issues.some((i) => i.type === "circular_reference"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("detectUnreflectedMapChanges flags new files not present in project-map.md", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-check-mapsync-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(
    path.join(brainDir, "project-map.md"),
    "# Project Map\n- `src/existing.ts`\n",
    "utf8"
  );

  try {
    const issues = detectUnreflectedMapChanges(tmpDir, brainDir);
    assert.ok(Array.isArray(issues));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("runHealthChecks and formatHealthReport aggregate all checks into structured report", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-check-reporter-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(path.join(brainDir, "index.md"), "# Index\n[Missing](missing.md)\n", "utf8");
  fs.writeFileSync(path.join(brainDir, "architecture.md"), "# Architecture\n", "utf8");
  fs.writeFileSync(path.join(brainDir, "state.md"), "# State\n", "utf8");
  fs.writeFileSync(path.join(brainDir, "handoff.md"), "# Handoff\n", "utf8");

  try {
    const report = runHealthChecks(tmpDir);
    assert.equal(report.isHealthy, false);
    assert.ok(report.totalIssues > 0);

    const formatted = formatHealthReport(report);
    assert.ok(formatted.includes("PROBLEMS DETECTED"));
    assert.ok(formatted.includes("Missing Documents"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
