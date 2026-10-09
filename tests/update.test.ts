import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  loadPersistedScanState,
  detectAddedFiles,
  detectModifiedFiles,
  detectRemovedFiles,
  detectMetadataChanges,
  extractFileDependencies,
  updateProjectModelIncrementally,
  computeProjectDiff,
  formatUpdateSummary,
} from "../src/scanner/updater.js";
import {
  traverseProject,
  recordDiscoveredFiles,
  recordDiscoveredDirectories,
  generateProjectSummary,
  persistScanResults,
} from "../src/scanner/scanner.js";
import { createProjectModel, createFileModel } from "../src/core/model.js";
import { updateCommand, UPDATE_SUCCESS, UPDATE_FAILURE } from "../src/commands/update.js";

test("updater diff detection accurately identifies added, modified, and removed files", () => {
  const f1 = createFileModel({ path: "/p/a.ts", relativePath: "a.ts", name: "a.ts", extension: ".ts", size: 100, language: "TypeScript" });
  const f2 = createFileModel({ path: "/p/b.ts", relativePath: "b.ts", name: "b.ts", extension: ".ts", size: 200, language: "TypeScript" });
  const f3 = createFileModel({ path: "/p/c.ts", relativePath: "c.ts", name: "c.ts", extension: ".ts", size: 300, language: "TypeScript" });

  const previous = [f1, f2];

  // In current: f1 is modified (size 150), f2 is removed, f3 is added
  const f1Mod = { ...f1, size: 150 };
  const current = [f1Mod, f3];

  const added = detectAddedFiles(current, previous);
  const modified = detectModifiedFiles(current, previous);
  const removed = detectRemovedFiles(current, previous);
  const meta = detectMetadataChanges(current, previous);

  assert.equal(added.length, 1);
  assert.equal(added[0].relativePath, "c.ts");

  assert.equal(modified.length, 1);
  assert.equal(modified[0].relativePath, "a.ts");

  assert.equal(removed.length, 1);
  assert.equal(removed[0].relativePath, "b.ts");

  assert.equal(meta.length, 1);
  assert.deepEqual(meta[0].changes, ["size"]);

  const diff = computeProjectDiff(current, previous);
  assert.equal(diff.hasChanges, true);
  const summaryText = formatUpdateSummary(diff);
  assert.ok(summaryText.includes("+ c.ts"));
  assert.ok(summaryText.includes("~ a.ts"));
  assert.ok(summaryText.includes("- b.ts"));
});

test("updateProjectModelIncrementally correctly reconciles project state", () => {
  const baseModel = createProjectModel("test", "/root");
  const fileA = createFileModel({ path: "/root/a.ts", relativePath: "a.ts", name: "a.ts", extension: ".ts", size: 10 });
  const fileB = createFileModel({ path: "/root/b.ts", relativePath: "b.ts", name: "b.ts", extension: ".ts", size: 20 });
  baseModel.files = [fileA, fileB];

  const fileC = createFileModel({ path: "/root/c.ts", relativePath: "c.ts", name: "c.ts", extension: ".ts", size: 30 });
  const fileAMod = { ...fileA, size: 15 };

  const updated = updateProjectModelIncrementally(baseModel, {
    addedFiles: [fileC],
    modifiedFiles: [fileAMod],
    removedFiles: [fileB],
  });

  assert.equal(updated.files.length, 2);
  assert.equal(updated.files[0].relativePath, "a.ts");
  assert.equal(updated.files[0].size, 15);
  assert.equal(updated.files[1].relativePath, "c.ts");
});

test("extractFileDependencies recomputes dependencies from package.json", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-deps-test-"));
  try {
    const pkgPath = path.join(tmpDir, "package.json");
    fs.writeFileSync(
      pkgPath,
      JSON.stringify({
        dependencies: { express: "^4.18.2" },
        devDependencies: { typescript: "^5.0.0" },
      }),
      "utf8"
    );

    const deps = extractFileDependencies(pkgPath, tmpDir);
    assert.equal(deps.length, 2);
    assert.equal(deps[0].name, "express");
    assert.equal(deps[0].kind, "production");
    assert.equal(deps[1].name, "typescript");
    assert.equal(deps[1].kind, "development");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("updateCommand works end-to-end for unchanged and changed project states", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-update-e2e-"));
  try {
    // 1. Calling update without prior scan fails gracefully
    assert.equal(updateCommand([tmpDir]), UPDATE_FAILURE);

    // 2. Setup project and initial scan
    fs.mkdirSync(path.join(tmpDir, ".brain"), { recursive: true });
    const f1Path = path.join(tmpDir, "file1.ts");
    const f2Path = path.join(tmpDir, "file2.ts");
    fs.writeFileSync(f1Path, "export const a = 1;", "utf8");
    fs.writeFileSync(f2Path, "export const b = 2;", "utf8");

    const t1 = traverseProject(tmpDir);
    const files1 = recordDiscoveredFiles(t1.files, t1.rootPath);
    const dirs1 = recordDiscoveredDirectories(t1.directories, t1.rootPath, t1.files);
    const s1 = generateProjectSummary(t1.rootPath, files1, dirs1);
    persistScanResults(tmpDir, s1, undefined, files1);

    // 3. Update with no changes -> success (no-op)
    assert.equal(updateCommand([tmpDir]), UPDATE_SUCCESS);

    // 4. Modify file1, remove file2, add file3
    fs.writeFileSync(f1Path, "export const a = 1000000000;", "utf8");
    fs.rmSync(f2Path);
    const f3Path = path.join(tmpDir, "file3.ts");
    fs.writeFileSync(f3Path, "export const c = 3;", "utf8");

    // 5. Update with changes
    assert.equal(updateCommand([tmpDir]), UPDATE_SUCCESS);

    // Verify persisted state reflects the update
    const state = loadPersistedScanState(tmpDir);
    assert.ok(state);
    assert.equal(state?.summary.totalFiles, 2);
    const storedRelPaths = state?.files?.map((f) => f.relativePath).sort();
    assert.deepEqual(storedRelPaths, ["file1.ts", "file3.ts"]);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("detectModifiedFiles detects edits where file size does not change using SHA-256 content hashes", () => {
  const f1 = createFileModel({
    path: "/p/a.ts",
    relativePath: "a.ts",
    name: "a.ts",
    extension: ".ts",
    size: 20,
    hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });
  // Same size (20), but different hash
  const f1Mod = createFileModel({
    path: "/p/a.ts",
    relativePath: "a.ts",
    name: "a.ts",
    extension: ".ts",
    size: 20,
    hash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  });

  const modified = detectModifiedFiles([f1Mod], [f1]);
  assert.equal(modified.length, 1);
  assert.equal(modified[0].relativePath, "a.ts");

  const diff = computeProjectDiff([f1Mod], [f1]);
  assert.equal(diff.hasChanges, true);
  assert.equal(diff.modified.length, 1);
  assert.equal(diff.modified[0].relativePath, "a.ts");
});

test("updateCommand detects modification when file size does not change and is idempotent on second run", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-update-hash-"));
  try {
    fs.mkdirSync(path.join(tmpDir, ".brain"), { recursive: true });
    const fPath = path.join(tmpDir, "config.ts");
    // "export const flag = true;" is 25 bytes
    fs.writeFileSync(fPath, "export const flag = true;", "utf8");

    const t1 = traverseProject(tmpDir);
    const files1 = recordDiscoveredFiles(t1.files, t1.rootPath);
    const dirs1 = recordDiscoveredDirectories(t1.directories, t1.rootPath, t1.files);
    const s1 = generateProjectSummary(t1.rootPath, files1, dirs1);
    persistScanResults(tmpDir, s1, undefined, files1);

    // Initial update without changes should be a no-op
    assert.equal(updateCommand([tmpDir]), UPDATE_SUCCESS);

    // Change file content without changing size: "export const flag = fals;" is also 25 bytes
    fs.writeFileSync(fPath, "export const flag = fals;", "utf8");

    // updateCommand must detect that the file was modified despite identical size
    assert.equal(updateCommand([tmpDir]), UPDATE_SUCCESS);

    const state = loadPersistedScanState(tmpDir);
    assert.ok(state);
    assert.equal(state?.files?.length, 1);
    assert.ok(state?.files?.[0].hash);

    // Second run with no further changes must report no changes
    assert.equal(updateCommand([tmpDir]), UPDATE_SUCCESS);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
