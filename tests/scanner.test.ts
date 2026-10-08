import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  traverseProject,
  recordDiscoveredFile,
  recordDiscoveredFiles,
  recordDiscoveredDirectory,
  recordDiscoveredDirectories,
  extractFileExtension,
  collectFileExtensions,
  countFilesByExtension,
  generateProjectSummary,
  formatProjectSummary,
  persistScanResults,
} from "../src/scanner/scanner.js";
import { detectLanguageByExtension, detectProjectLanguages } from "../src/scanner/languages.js";
import { scanCommand, SCAN_SUCCESS } from "../src/commands/scan.js";
import { createDefaultExclusionConfig } from "../src/scanner/exclusions.js";

test("traverseProject discovers non-ignored files and directories while omitting exclusions", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-scanner-test-"));
  try {
    // Normal files
    fs.mkdirSync(path.join(tmpDir, "src", "utils"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "src", "index.ts"), "console.log('hi');");
    fs.writeFileSync(path.join(tmpDir, "src", "utils", "helper.ts"), "export const x = 1;");
    fs.writeFileSync(path.join(tmpDir, "README.md"), "# Test Project");

    // Excluded directory: node_modules
    fs.mkdirSync(path.join(tmpDir, "node_modules", "pkg"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "node_modules", "pkg", "index.js"), "module.exports = {};");

    // Excluded directory: .git
    fs.mkdirSync(path.join(tmpDir, ".git", "objects"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".git", "HEAD"), "ref: refs/heads/main");

    // Excluded directory: dist
    fs.mkdirSync(path.join(tmpDir, "dist"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "dist", "bundle.js"), "var a;");

    // Custom gitignore
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "*.log\nsecret/\n");
    fs.writeFileSync(path.join(tmpDir, "debug.log"), "error log");
    fs.mkdirSync(path.join(tmpDir, "secret"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "secret", "keys.txt"), "key");

    const result = traverseProject(tmpDir);

    // Normalize paths for assertion
    const relFiles = result.files.map((f) => path.relative(tmpDir, f).replace(/\\/g, "/"));
    const relDirs = result.directories.map((d) => path.relative(tmpDir, d).replace(/\\/g, "/"));

    // Expected files
    assert.ok(relFiles.includes("src/index.ts"));
    assert.ok(relFiles.includes("src/utils/helper.ts"));
    assert.ok(relFiles.includes("README.md"));
    assert.ok(relFiles.includes(".gitignore"));

    // Excluded files must NOT be present
    assert.ok(!relFiles.some((f) => f.startsWith("node_modules/")));
    assert.ok(!relFiles.some((f) => f.startsWith(".git/")));
    assert.ok(!relFiles.some((f) => f.startsWith("dist/")));
    assert.ok(!relFiles.includes("debug.log"));
    assert.ok(!relFiles.some((f) => f.startsWith("secret/")));

    // Expected directories
    assert.ok(relDirs.includes("src"));
    assert.ok(relDirs.includes("src/utils"));
    assert.ok(!relDirs.includes("node_modules"));
    assert.ok(!relDirs.includes(".git"));
    assert.ok(!relDirs.includes("dist"));
    assert.ok(!relDirs.includes("secret"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("recordDiscoveredFile and recordDiscoveredDirectory produce accurate models", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-record-test-"));
  try {
    const filePath = path.join(tmpDir, "main.dart");
    fs.writeFileSync(filePath, "void main() {}", "utf8");

    const fileModel = recordDiscoveredFile(filePath, tmpDir);
    assert.equal(fileModel.name, "main.dart");
    assert.equal(fileModel.extension, ".dart");
    assert.equal(fileModel.language, "Dart");
    assert.equal(fileModel.size, fs.statSync(filePath).size);

    const dirModel = recordDiscoveredDirectory(tmpDir, tmpDir, [filePath], []);
    assert.equal(dirModel.fileCount, 1);
    assert.deepEqual(dirModel.subdirectories, []);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("extensions and languages helpers correctly aggregate project statistics", () => {
  const files = [
    { extension: ".ts", language: "TypeScript" },
    { extension: ".ts", language: "TypeScript" },
    { extension: ".py", language: "Python" },
    { extension: ".md", language: "Markdown" },
  ];

  const extCounts = countFilesByExtension(files as any);
  assert.equal(extCounts[".ts"], 2);
  assert.equal(extCounts[".py"], 1);
  assert.equal(extCounts[".md"], 1);

  const langSummary = detectProjectLanguages(files);
  assert.equal(langSummary.length, 3);
  assert.equal(langSummary[0].name, "TypeScript");
  assert.equal(langSummary[0].fileCount, 2);
  assert.equal(langSummary[0].percentage, 50);
});

test("generateProjectSummary, formatProjectSummary, and persistScanResults work end-to-end", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-summary-test-"));
  try {
    fs.mkdirSync(path.join(tmpDir, ".brain"), { recursive: true });
    const filePath = path.join(tmpDir, "index.ts");
    fs.writeFileSync(filePath, "console.log('hi');", "utf8");

    const fileModel = recordDiscoveredFile(filePath, tmpDir);
    const dirModel = recordDiscoveredDirectory(tmpDir, tmpDir, [filePath], []);

    const summary = generateProjectSummary(tmpDir, [fileModel], [dirModel]);
    assert.equal(summary.totalFiles, 1);
    assert.equal(summary.totalDirectories, 1);
    assert.equal(summary.totalBytes, 18);

    const formatted = formatProjectSummary(summary);
    assert.ok(formatted.includes("Files: 1"));
    assert.ok(formatted.includes("TypeScript: 1 files (100%)"));

    const persistedPath = persistScanResults(path.join(tmpDir, ".brain"), summary);
    assert.ok(fs.existsSync(persistedPath));
    const saved = JSON.parse(fs.readFileSync(persistedPath, "utf8"));
    assert.equal(saved.summary.totalFiles, 1);

    const cliExit = scanCommand([tmpDir]);
    assert.equal(cliExit, SCAN_SUCCESS);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
