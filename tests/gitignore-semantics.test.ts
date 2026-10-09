import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  isGitignored,
  matchGitignorePattern,
  loadGitignorePatterns,
} from "../src/scanner/exclusions.js";
import { traverseProject } from "../src/scanner/scanner.js";

test("B1 regression: basic file patterns, directory patterns, wildcards, negation, and directory depth", () => {
  const patterns = [
    "*.log",
    "!important.log",
    "temp/",
    "/root-only.txt",
    "docs/**/*.pdf",
  ];

  // Basic file pattern & negation
  assert.equal(isGitignored("debug.log", patterns), true);
  assert.equal(isGitignored("nested/folder/debug.log", patterns), true);
  assert.equal(isGitignored("important.log", patterns), false);

  // Directory pattern
  assert.equal(isGitignored("temp", patterns, true), true);
  assert.equal(isGitignored("temp/file.txt", patterns, false), true);
  assert.equal(isGitignored("sub/temp/file.txt", patterns, false), true);
  assert.equal(isGitignored("temp.txt", patterns, false), false);

  // Anchored pattern (/root-only.txt)
  assert.equal(isGitignored("root-only.txt", patterns), true);
  assert.equal(isGitignored("sub/root-only.txt", patterns), false);

  // Globstar wildcard (docs/**/*.pdf)
  assert.equal(isGitignored("docs/manual.pdf", patterns), true);
  assert.equal(isGitignored("docs/v1/deep/manual.pdf", patterns), true);
  assert.equal(isGitignored("docs/manual.md", patterns), false);
});

test("B1 regression: nested .gitignore files in subdirectories are respected by traversal", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-b1-nested-"));
  try {
    // Root structure
    const pkgADir = path.join(tmpDir, "packages", "pkg-a");
    const pkgBDir = path.join(tmpDir, "packages", "pkg-b");
    fs.mkdirSync(pkgADir, { recursive: true });
    fs.mkdirSync(pkgBDir, { recursive: true });

    // Root gitignore ignores *.log
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "*.log\n", "utf8");

    // pkg-a has nested .gitignore ignoring local-cache/ and *.tmp
    fs.mkdirSync(path.join(pkgADir, "local-cache"), { recursive: true });
    fs.writeFileSync(path.join(pkgADir, ".gitignore"), "local-cache/\n*.tmp\n", "utf8");
    fs.writeFileSync(path.join(pkgADir, "local-cache", "data.json"), "{}", "utf8");
    fs.writeFileSync(path.join(pkgADir, "temp.tmp"), "tmp", "utf8");
    fs.writeFileSync(path.join(pkgADir, "index.ts"), "export const a = 1;", "utf8");

    // pkg-b has no nested gitignore, so *.tmp in pkg-b should NOT be ignored unless in root
    fs.writeFileSync(path.join(pkgBDir, "temp.tmp"), "tmp", "utf8");
    fs.writeFileSync(path.join(pkgBDir, "index.ts"), "export const b = 2;", "utf8");

    const result = traverseProject(tmpDir);
    const relativeFiles = result.files.map((f) => path.relative(tmpDir, f).replace(/\\/g, "/"));

    // pkg-a ignored files
    assert.ok(!relativeFiles.includes("packages/pkg-a/local-cache/data.json"));
    assert.ok(!relativeFiles.includes("packages/pkg-a/temp.tmp"));
    assert.ok(relativeFiles.includes("packages/pkg-a/index.ts"));

    // pkg-b files
    assert.ok(relativeFiles.includes("packages/pkg-b/temp.tmp"), "pkg-b temp.tmp should not be ignored by pkg-a gitignore");
    assert.ok(relativeFiles.includes("packages/pkg-b/index.ts"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
