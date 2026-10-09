import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run, EXIT_SUCCESS, EXIT_FAILURE } from "../src/cli.js";
import { runHealthChecks, formatHealthReport } from "../src/checker/health-reporter.js";
import { checkCommand, CHECK_SUCCESS, CHECK_FAILURE } from "../src/commands/check.js";

test("health-check end-to-end: clean project reports healthy and exits 0", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-check-e2e-clean-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(
    path.join(brainDir, "index.md"),
    "# Brain Index\n\n- [Architecture](architecture.md)\n- [State](state.md)\n- [Handoff](handoff.md)\n",
    "utf8"
  );
  fs.writeFileSync(path.join(brainDir, "architecture.md"), "# Architecture\n", "utf8");
  fs.writeFileSync(path.join(brainDir, "state.md"), "# State\n", "utf8");
  fs.writeFileSync(path.join(brainDir, "handoff.md"), "# Handoff\n", "utf8");

  try {
    const report = runHealthChecks(tmpDir);
    assert.equal(report.isHealthy, true);
    assert.equal(report.totalIssues, 0);

    const formatted = formatHealthReport(report);
    assert.ok(formatted.includes("HEALTHY"));
    assert.ok(formatted.includes("All integrity and routing checks passed cleanly."));

    const exitCode = checkCommand([tmpDir]);
    assert.equal(exitCode, CHECK_SUCCESS);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("health-check end-to-end: broken links and missing constitution docs report problems and exit 1", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-check-e2e-broken-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  // Missing architecture.md, broken link in index.md
  fs.writeFileSync(
    path.join(brainDir, "index.md"),
    "# Brain Index\n\n- [Missing Link](missing-doc.md)\n- [State](state.md)\n- [Handoff](handoff.md)\n",
    "utf8"
  );
  fs.writeFileSync(path.join(brainDir, "state.md"), "# State\n", "utf8");
  fs.writeFileSync(path.join(brainDir, "handoff.md"), "# Handoff\n", "utf8");

  try {
    const report = runHealthChecks(tmpDir);
    assert.equal(report.isHealthy, false);
    assert.ok(report.totalIssues >= 2);

    const formatted = formatHealthReport(report);
    assert.ok(formatted.includes("PROBLEMS DETECTED"));
    assert.ok(formatted.includes("Missing Documents"));

    const exitCode = checkCommand([tmpDir]);
    assert.equal(exitCode, CHECK_FAILURE);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("health-check cli command executes end-to-end on target repository", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-check-cli-e2e-"));
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(
    path.join(brainDir, "index.md"),
    "# Brain Index\n\n- [Architecture](architecture.md)\n- [State](state.md)\n- [Handoff](handoff.md)\n",
    "utf8"
  );
  fs.writeFileSync(path.join(brainDir, "architecture.md"), "# Architecture\n", "utf8");
  fs.writeFileSync(path.join(brainDir, "state.md"), "# State\n", "utf8");
  fs.writeFileSync(path.join(brainDir, "handoff.md"), "# Handoff\n", "utf8");

  try {
    const code = checkCommand([tmpDir]);
    assert.equal(code, EXIT_SUCCESS);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
