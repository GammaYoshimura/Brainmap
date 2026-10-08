import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskQuery } from "../src/router/query.js";
import { resolveExactPathMatches } from "../src/router/path-matcher.js";

test("resolveExactPathMatches matches candidate path from tokens", () => {
  const query = parseTaskQuery("Please check src/cli.ts and see what is missing");
  assert.notEqual(query, null);

  const candidates = ["src/cli.ts", "src/commands/init.ts", "package.json"];
  const matches = resolveExactPathMatches(candidates, query!);

  assert.equal(matches.length, 1);
  assert.equal(matches[0].path, "src/cli.ts");
});

test("resolveExactPathMatches matches candidate path with Windows backslashes normalized", () => {
  const query = parseTaskQuery("Inspect src\\commands\\route.ts for options");
  assert.notEqual(query, null);

  const candidates = ["src/commands/route.ts", "src/cli.ts"];
  const matches = resolveExactPathMatches(candidates, query!);

  assert.equal(matches.length, 1);
  assert.equal(matches[0].path, "src/commands/route.ts");
});

test("resolveExactPathMatches returns multiple matches in deterministic alphabetical order", () => {
  const query = parseTaskQuery("Diff src/core/paths.ts against tests/paths.test.ts");
  assert.notEqual(query, null);

  const candidates = [
    "tests/paths.test.ts",
    "src/core/paths.ts",
    "src/cli.ts",
    "package.json",
  ];
  const matches = resolveExactPathMatches(candidates, query!);

  assert.equal(matches.length, 2);
  assert.equal(matches[0].path, "src/core/paths.ts");
  assert.equal(matches[1].path, "tests/paths.test.ts");
});

test("resolveExactPathMatches returns empty array when no paths match", () => {
  const query = parseTaskQuery("Add OAuth2 refresh token logic to authentication");
  assert.notEqual(query, null);

  const candidates = ["src/cli.ts", "src/core/model.ts"];
  const matches = resolveExactPathMatches(candidates, query!);

  assert.deepEqual(matches, []);
});

test("resolveExactPathMatches handles empty candidates gracefully", () => {
  const query = parseTaskQuery("Check src/cli.ts");
  const matches = resolveExactPathMatches([], query!);
  assert.deepEqual(matches, []);
});
