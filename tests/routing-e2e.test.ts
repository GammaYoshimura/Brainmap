import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run, EXIT_SUCCESS, EXIT_FAILURE } from "../src/cli.js";
import { parseTaskQuery } from "../src/router/query.js";
import { executeRouting } from "../src/router/route-pipeline.js";

function setupCompleteRoutingFixture(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-routing-e2e-"));

  // 1. Brain structure
  const brainDir = path.join(tmpDir, ".brain");
  fs.mkdirSync(path.join(brainDir, "decisions"), { recursive: true });
  fs.mkdirSync(path.join(brainDir, "subsystems", "auth"), { recursive: true });

  fs.writeFileSync(path.join(brainDir, "index.md"), "# Brain Index\n");
  fs.writeFileSync(
    path.join(brainDir, "architecture.md"),
    "# Architecture Constitution\n\nPrinciples and module boundaries.\n"
  );
  fs.writeFileSync(path.join(brainDir, "state.md"), "# Project State\n\nCurrent milestone: auth.\n");
  fs.writeFileSync(path.join(brainDir, "handoff.md"), "# Session Handoff\n\nNext action: auth.\n");
  fs.writeFileSync(
    path.join(brainDir, "decisions", "0001-jwt-auth.md"),
    "# ADR 0001: JWT Authentication\n\nStatus: Accepted\nWe choose JWT tokens.\n"
  );
  fs.writeFileSync(
    path.join(brainDir, "subsystems", "auth", "index.md"),
    "# Authentication Subsystem\n\nHandles user login and token generation.\n"
  );

  // 2. Manifest
  fs.writeFileSync(
    path.join(tmpDir, "package.json"),
    JSON.stringify(
      {
        name: "test-auth-app",
        version: "1.0.0",
        dependencies: {
          jsonwebtoken: "^9.0.0",
          bcrypt: "^5.1.0",
        },
      },
      null,
      2
    )
  );

  // 3. Source files
  fs.mkdirSync(path.join(tmpDir, "src", "auth"), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, "src", "auth", "token.ts"),
    "export function generateToken() { return 'jwt'; }\nexport function verifyToken() { return true; }\n"
  );
  fs.writeFileSync(
    path.join(tmpDir, "src", "auth", "service.ts"),
    "export class AuthService { login() {} }\n"
  );

  // 4. Test file
  fs.mkdirSync(path.join(tmpDir, "tests"), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, "tests", "token.test.ts"),
    "import test from 'node:test';\n"
  );

  return tmpDir;
}

test("routing end-to-end resolves documents, source files, tests, and dependencies", () => {
  const fixtureDir = setupCompleteRoutingFixture();
  try {
    const query = parseTaskQuery("Add generateToken support to authentication using jsonwebtoken");
    assert.notEqual(query, null);

    const result = executeRouting(fixtureDir, query!);

    // Brain docs
    assert.ok(result.brainDocs.length > 0);
    assert.ok(result.brainDocs.some((d) => d.path.includes("auth")));

    // Source files
    assert.ok(result.sourceFiles.length > 0);
    assert.equal(result.sourceFiles[0].path, "src/auth/token.ts");

    // Tests (corresponds to token.ts)
    assert.ok(result.tests.length > 0);
    assert.equal(result.tests[0].path, "tests/token.test.ts");

    // Dependencies
    assert.ok(result.dependencies.length > 0);
    assert.ok(result.dependencies.some((d) => d.path.startsWith("jsonwebtoken")));
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test("cli route command runs end-to-end with query", () => {
  const code = run(["route", "Add refresh-token support to authentication"]);
  assert.equal(code, EXIT_SUCCESS);
});

test("cli route command supports --json flag and produces valid JSON output", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (msg?: unknown) => {
    capturedOutput += String(msg) + "\n";
  };

  try {
    const code = run(["route", "Refactor query parser", "--json"]);
    assert.equal(code, EXIT_SUCCESS);

    const parsed = JSON.parse(capturedOutput);
    assert.equal(parsed.query, "Refactor query parser");
    assert.ok(Array.isArray(parsed.sourceFiles));
    assert.ok(Array.isArray(parsed.brainDocs));
  } finally {
    console.log = originalLog;
  }
});
