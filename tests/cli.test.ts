import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run, HELP_TEXT, EXIT_SUCCESS, EXIT_FAILURE } from "../src/cli.js";

test("cli runs successfully with no arguments", () => {
  const code = run([]);
  assert.equal(code, EXIT_SUCCESS);
});

test("cli returns success and shows help on --help", () => {
  const code = run(["--help"]);
  assert.equal(code, EXIT_SUCCESS);
});

test("cli dispatches map command successfully", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-cli-map-"));
  try {
    const code = run(["map", tmpDir]);
    assert.equal(code, EXIT_SUCCESS);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("cli dispatches route command successfully with query", () => {
  const code = run(["route", "Add refresh-token support to authentication"]);
  assert.equal(code, EXIT_SUCCESS);
});

test("cli dispatches context command successfully with query", () => {
  const code = run(["context", "Add refresh-token support to authentication"]);
  assert.equal(code, EXIT_SUCCESS);
});

test("cli dispatches handoff command successfully", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-cli-handoff-"));
  try {
    fs.mkdirSync(path.join(tmpDir, ".brain"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".brain", "state.md"), "# Project State\n\n## Current Milestone\n**M001**: Test\n", "utf8");
    const code = run(["handoff", tmpDir]);
    assert.equal(code, EXIT_SUCCESS);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("cli dispatches check command successfully", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-cli-check-"));
  try {
    const code = run(["check", tmpDir]);
    assert.equal(code, EXIT_SUCCESS);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("cli fails when context is invoked without query", () => {
  const code = run(["context"]);
  assert.equal(code, EXIT_FAILURE);
});

test("cli fails when route is invoked without query", () => {
  const code = run(["route"]);
  assert.equal(code, EXIT_FAILURE);
});

test("cli returns failure on unknown option", () => {
  const code = run(["--unknown-flag"]);
  assert.equal(code, EXIT_FAILURE);
});

test("B2 regression: cli returns failure on unknown command", () => {
  const code = run(["nonexistent-command"]);
  assert.equal(code, EXIT_FAILURE);
});

test("B2 regression: invalid options for known commands exit with failure", () => {
  assert.equal(run(["init", "--invalid-flag"]), EXIT_FAILURE);
  assert.equal(run(["scan", "--invalid-flag"]), EXIT_FAILURE);
  assert.equal(run(["update", "--invalid-flag"]), EXIT_FAILURE);
  assert.equal(run(["map", "--invalid-flag"]), EXIT_FAILURE);
  assert.equal(run(["route", "query", "--invalid-flag"]), EXIT_FAILURE);
  assert.equal(run(["context", "query", "--invalid-flag"]), EXIT_FAILURE);
  assert.equal(run(["handoff", "--invalid-flag"]), EXIT_FAILURE);
  assert.equal(run(["check", "--invalid-flag"]), EXIT_FAILURE);
});
