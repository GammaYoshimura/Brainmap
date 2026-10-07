import test from "node:test";
import assert from "node:assert/strict";
import { normalizePath, toRelativePath, toAbsolutePath } from "../src/core/paths.js";

test("normalizePath converts backslashes to forward slashes", () => {
  assert.equal(normalizePath("src\\core\\model.ts"), "src/core/model.ts");
  assert.equal(normalizePath("C:\\Users\\Albert\\Project"), "C:/Users/Albert/Project");
});

test("toRelativePath generates normalized relative path", () => {
  const base = "C:/Users/Albert/Project";
  const target = "C:/Users/Albert/Project/src/index.ts";
  assert.equal(toRelativePath(base, target), "src/index.ts");
});

test("toAbsolutePath generates normalized absolute path", () => {
  const base = "C:/Users/Albert/Project";
  const relative = "src/index.ts";
  assert.equal(toAbsolutePath(base, relative), "C:/Users/Albert/Project/src/index.ts");
});
