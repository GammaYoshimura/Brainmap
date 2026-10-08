import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createDefaultExclusionConfig,
  detectGitignore,
  loadGitignorePatterns,
  matchGitignorePattern,
  isGitignored,
  isGitDirectory,
  isDependencyDirectory,
  isBuildDirectory,
  shouldExclude,
} from "../src/scanner/exclusions.js";

test("detectGitignore and loadGitignorePatterns correctly detect and parse patterns", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-gitignore-test-"));
  try {
    assert.equal(detectGitignore(tmpDir), null);
    assert.deepEqual(loadGitignorePatterns(tmpDir), []);

    const gitignorePath = path.join(tmpDir, ".gitignore");
    fs.writeFileSync(gitignorePath, "# Comment\n\nnode_modules/\n*.log\n!important.log\n", "utf8");

    assert.equal(detectGitignore(tmpDir), gitignorePath);
    const patterns = loadGitignorePatterns(tmpDir);
    assert.deepEqual(patterns, ["node_modules/", "*.log", "!important.log"]);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("isGitDirectory detects .git paths and rejects others", () => {
  assert.equal(isGitDirectory(".git"), true);
  assert.equal(isGitDirectory(".git/config"), true);
  assert.equal(isGitDirectory("submodule/.git/HEAD"), true);
  assert.equal(isGitDirectory("src/git-utils.ts"), false);
  assert.equal(isGitDirectory("src/main.ts"), false);
});

test("isDependencyDirectory detects standard dependency roots", () => {
  assert.equal(isDependencyDirectory("node_modules/foo/index.js"), true);
  assert.equal(isDependencyDirectory("vendor/autoload.php"), true);
  assert.equal(isDependencyDirectory(".venv/bin/python"), true);
  assert.equal(isDependencyDirectory("Pods/Target/Pod.h"), true);
  assert.equal(isDependencyDirectory("src/services/user.ts"), false);
});

test("isBuildDirectory detects build and output folders", () => {
  assert.equal(isBuildDirectory("dist/bundle.js"), true);
  assert.equal(isBuildDirectory("build/outputs/app.apk"), true);
  assert.equal(isBuildDirectory("target/release/app"), true);
  assert.equal(isBuildDirectory("bin/Debug/app.exe"), true);
  assert.equal(isBuildDirectory("src/components/button.tsx"), false);
});

test("isGitignored handles wildcards, directory boundaries, and negation", () => {
  const patterns = ["*.tmp", "coverage/", "!important.tmp"];
  assert.equal(isGitignored("cache/temp.tmp", patterns), true);
  assert.equal(isGitignored("coverage/lcov.info", patterns), true);
  assert.equal(isGitignored("important.tmp", patterns), false);
  assert.equal(isGitignored("src/index.ts", patterns), false);
});

test("shouldExclude adheres to ExclusionConfig flags and custom rules", () => {
  const config = createDefaultExclusionConfig();

  // Exclude git
  assert.equal(shouldExclude(".git/HEAD", config), true);
  // Exclude dependencies
  assert.equal(shouldExclude("node_modules/pkg/index.js", config), true);
  // Exclude build outputs
  assert.equal(shouldExclude("dist/index.js", config), true);
  // Normal source file not excluded
  assert.equal(shouldExclude("src/app.ts", config), false);

  // Custom directory exclusion
  const customConfig = {
    ...config,
    ignoredDirectories: ["fixtures", ...config.ignoredDirectories],
    customPatterns: ["*.backup"],
  };
  assert.equal(shouldExclude("tests/fixtures/sample.json", customConfig), true);
  assert.equal(shouldExclude("data/archive.backup", customConfig), true);
});
