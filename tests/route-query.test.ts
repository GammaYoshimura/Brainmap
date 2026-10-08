import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskQuery, normalizeQueryText, tokenizeQuery } from "../src/router/query.js";

test("normalizeQueryText lowercases and cleans punctuation", () => {
  const normalized = normalizeQueryText("Add Refresh-Token Support to Auth!");
  assert.equal(normalized, "add refresh-token support to auth");
});

test("tokenizeQuery splits into unique normalized tokens", () => {
  const tokens = tokenizeQuery("auth token support auth/token");
  assert.deepEqual(tokens, ["auth", "token", "support"]);
});

test("parseTaskQuery parses single string query", () => {
  const q = parseTaskQuery("Fix database connection timeout");
  assert.notEqual(q, null);
  assert.equal(q?.raw, "Fix database connection timeout");
  assert.equal(q?.normalized, "fix database connection timeout");
  assert.deepEqual(q?.tokens, ["fix", "database", "connection", "timeout"]);
});

test("parseTaskQuery parses array of args into full query", () => {
  const q = parseTaskQuery(["add", "JWT", "verification", "to", "API"]);
  assert.notEqual(q, null);
  assert.equal(q?.raw, "add JWT verification to API");
  assert.equal(q?.normalized, "add jwt verification to api");
  assert.deepEqual(q?.tokens, ["add", "jwt", "verification", "to", "api"]);
});

test("parseTaskQuery returns null for empty or whitespace query", () => {
  assert.equal(parseTaskQuery(""), null);
  assert.equal(parseTaskQuery("   "), null);
  assert.equal(parseTaskQuery([]), null);
  assert.equal(parseTaskQuery(["", "  "]), null);
});
