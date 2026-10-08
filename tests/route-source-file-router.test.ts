import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseTaskQuery } from "../src/router/query.js";
import {
  isTestPath,
  isSourceFile,
  routeRelevantSourceFiles,
} from "../src/router/source-file-router.js";

test("isTestPath identifies test files and test directories", () => {
  assert.equal(isTestPath("tests/cli.test.ts"), true);
  assert.equal(isTestPath("test/app.spec.js"), true);
  assert.equal(isTestPath("src/__tests__/util.ts"), true);
  assert.equal(isTestPath("src/cli.ts"), false);
});

test("isSourceFile excludes brain documents, tests, and non-code files", () => {
  assert.equal(isSourceFile(".brain/architecture.md"), false);
  assert.equal(isSourceFile("tests/cli.test.ts"), false);
  assert.equal(isSourceFile("src/cli.ts"), true);
  assert.equal(isSourceFile("package.json"), true);
  assert.equal(isSourceFile("image.png"), false);
});

test("routeRelevantSourceFiles resolves source files by filename and symbol matches", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-source-router-test-"));
  try {
    fs.mkdirSync(path.join(tmpDir, "src", "auth"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, "src", "auth", "token.ts"),
      "export function generateRefreshToken() { return 'token'; }\n"
    );
    fs.writeFileSync(
      path.join(tmpDir, "src", "auth", "login.ts"),
      "export function login() { return true; }\n"
    );

    const query = parseTaskQuery("Add generateRefreshToken support to authentication");
    assert.notEqual(query, null);

    const ranked = routeRelevantSourceFiles(tmpDir, query!, {
      files: ["src/auth/token.ts", "src/auth/login.ts"],
      subsystems: [
        { id: "auth", name: "Authentication Subsystem", path: "src/auth" },
      ],
    });

    assert.ok(ranked.length >= 1);
    assert.equal(ranked[0].path, "src/auth/token.ts");
    assert.ok(ranked[0].reasons.some((r) => r.includes("generateRefreshToken")));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
