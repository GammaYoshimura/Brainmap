import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskQuery } from "../src/router/query.js";
import { resolveFilenameMatches } from "../src/router/filename-matcher.js";

test("resolveFilenameMatches matches exact filename in query", () => {
  const query = parseTaskQuery("Please check cli.ts to verify the commands");
  assert.notEqual(query, null);

  const candidates = ["src/cli.ts", "src/commands/init.ts", "README.md"];
  const matches = resolveFilenameMatches(candidates, query!);

  assert.equal(matches.length, 1);
  assert.equal(matches[0].path, "src/cli.ts");
  assert.equal(matches[0].matchType, "exact-filename");
});

test("resolveFilenameMatches matches file stem in query", () => {
  const query = parseTaskQuery("Refactor updater logic to handle deleted directories");
  assert.notEqual(query, null);

  const candidates = ["src/scanner/updater.ts", "src/scanner/scanner.ts", "src/cli.ts"];
  const matches = resolveFilenameMatches(candidates, query!);

  assert.equal(matches.length, 1);
  assert.equal(matches[0].path, "src/scanner/updater.ts");
  assert.equal(matches[0].stem, "updater");
  assert.equal(matches[0].matchType, "stem");
});

test("resolveFilenameMatches prioritizes exact filename over stem", () => {
  const query = parseTaskQuery("Inspect scanner and scanner.ts thoroughly");
  assert.notEqual(query, null);

  const candidates = ["src/scanner/scanner.ts", "tests/scanner.test.ts"];
  const matches = resolveFilenameMatches(candidates, query!);

  assert.equal(matches.length, 2);
  assert.equal(matches[0].matchType, "exact-filename");
  assert.equal(matches[0].path, "src/scanner/scanner.ts");
  assert.equal(matches[1].matchType, "stem");
  assert.equal(matches[1].path, "tests/scanner.test.ts");
});

test("resolveFilenameMatches returns empty array when no filename or stem matches", () => {
  const query = parseTaskQuery("Configure authentication session cookies");
  assert.notEqual(query, null);

  const candidates = ["src/cli.ts", "src/core/paths.ts"];
  const matches = resolveFilenameMatches(candidates, query!);

  assert.deepEqual(matches, []);
});

test("resolveFilenameMatches handles empty candidates gracefully", () => {
  const query = parseTaskQuery("Check cli.ts");
  const matches = resolveFilenameMatches([], query!);
  assert.deepEqual(matches, []);
});
