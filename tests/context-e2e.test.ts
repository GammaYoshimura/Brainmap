import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run, EXIT_SUCCESS, EXIT_FAILURE } from "../src/cli.js";
import { parseTaskQuery } from "../src/router/query.js";
import {
  createContextInput,
  assembleContext,
} from "../src/context/context-selector.js";
import {
  formatContextText,
  formatContextJson,
  formatContextSummary,
} from "../src/context/formatter.js";
import { createContextBudget } from "../src/context/context-limits.js";

function setupContextFixture(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-context-e2e-"));

  // 1. Brain structure
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(path.join(brainDir, "decisions"), { recursive: true });
  fs.mkdirSync(path.join(brainDir, "subsystems", "auth"), { recursive: true });

  fs.writeFileSync(path.join(brainDir, "index.md"), "# Brain Index\n");
  fs.writeFileSync(
    path.join(brainDir, "architecture.md"),
    "# Architecture Constitution\nAuthentication subsystem boundaries.\n"
  );
  fs.writeFileSync(path.join(brainDir, "state.md"), "# Project State\nIn progress: auth.\n");
  fs.writeFileSync(path.join(brainDir, "handoff.md"), "# Handoff\nNext: token verification.\n");
  fs.writeFileSync(
    path.join(brainDir, "decisions", "0001-jwt.md"),
    "# ADR 0001: JWT Auth\nStatus: Accepted\nWe choose JWT.\n"
  );
  fs.writeFileSync(
    path.join(brainDir, "subsystems", "auth", "index.md"),
    "# Authentication Subsystem\nHandles authentication tokens.\n"
  );

  // 2. Source & Test files
  fs.mkdirSync(path.join(tmpDir, "src", "auth"), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, "src", "auth", "token.ts"),
    "export function generateToken() { return 'token'; }\n"
  );
  fs.writeFileSync(
    path.join(tmpDir, "src", "auth", "service.ts"),
    "export class AuthService {}\n"
  );

  fs.mkdirSync(path.join(tmpDir, "tests"), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, "tests", "token.test.ts"),
    "test('token', () => {});\n"
  );

  return tmpDir;
}

test("context-selection end-to-end resolves documents, source, and tests with prioritization", () => {
  const fixtureDir = setupContextFixture();
  try {
    const query = parseTaskQuery("token authentication");
    assert.notEqual(query, null);

    const input = createContextInput(fixtureDir, query!);
    const payload = assembleContext(input);

    assert.equal(payload.query, "token authentication");
    assert.equal(payload.projectRoot, fixtureDir);
    assert.ok(payload.items.length > 0);

    const paths = payload.items.map((i) => i.path);
    assert.ok(paths.some((p) => p.includes("token.ts")));
    assert.ok(paths.some((p) => p.includes(".brain")));

    const textOutput = formatContextText(payload);
    assert.match(textOutput, /=== Brainmap Context for: "token authentication" ===/);
    assert.match(textOutput, /--- \[.*\] .* ---/);

    const jsonOutput = formatContextJson(payload);
    const parsed = JSON.parse(jsonOutput);
    assert.equal(parsed.query, "token authentication");
    assert.ok(Array.isArray(parsed.items));

    const summaryOutput = formatContextSummary(payload);
    assert.match(summaryOutput, /Context Summary for: "token authentication"/);
    assert.match(summaryOutput, /Included files:/);
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test("context-selection respects strict budget limits and records omitted files", () => {
  const fixtureDir = setupContextFixture();
  try {
    const query = parseTaskQuery("token authentication");
    assert.notEqual(query, null);

    const input = createContextInput(fixtureDir, query!);
    // Tight budget allowing only 1 small file (e.g. 50 characters max)
    const tightBudget = createContextBudget(50, 1);
    const payload = assembleContext(input, tightBudget);

    assert.equal(payload.items.length, 1);
    assert.ok(payload.omittedCount > 0);
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test("cli context command runs end-to-end with flags", () => {
  const codeText = run(["context", "authentication token"]);
  assert.equal(codeText, EXIT_SUCCESS);

  const codeJson = run(["context", "authentication token", "--json"]);
  assert.equal(codeJson, EXIT_SUCCESS);

  const codeSummary = run(["context", "authentication token", "--summary"]);
  assert.equal(codeSummary, EXIT_SUCCESS);
});
