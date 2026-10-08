import test from "node:test";
import assert from "node:assert/strict";
import { createDirectoryModel, createFileModel } from "../src/core/model.js";
import { buildDirectoryMap, formatDirectoryMap } from "../src/mapper/directory-map.js";
import { buildFileMap, formatFileMap, formatFileSize } from "../src/mapper/file-map.js";
import { detectModules, formatModuleMap } from "../src/mapper/module-map.js";
import { buildEntryPointMap, formatEntryPointMap, inferEntryPointKind } from "../src/mapper/entrypoint-map.js";

test("buildDirectoryMap sorts directories and calculates depth", () => {
  const dirs = [
    createDirectoryModel({ path: "src/commands", relativePath: "src/commands", name: "commands", fileCount: 4, subdirectories: ["init", "scan"] }),
    createDirectoryModel({ path: "src", relativePath: "src", name: "src", fileCount: 1, subdirectories: ["commands", "core"] }),
    createDirectoryModel({ path: "tests", relativePath: "tests", name: "tests", fileCount: 5, subdirectories: [] }),
  ];

  const map = buildDirectoryMap(dirs);
  assert.equal(map.length, 3);
  assert.equal(map[0].relativePath, "src");
  assert.equal(map[0].depth, 1);
  assert.equal(map[1].relativePath, "src/commands");
  assert.equal(map[1].depth, 2);
  assert.equal(map[2].relativePath, "tests");
  assert.equal(map[2].depth, 1);
});

test("formatDirectoryMap formats directory hierarchy into markdown", () => {
  const dirs = [
    createDirectoryModel({ path: "src", relativePath: "src", name: "src", fileCount: 1, subdirectories: ["commands"] }),
    createDirectoryModel({ path: "src/commands", relativePath: "src/commands", name: "commands", fileCount: 2, subdirectories: [] }),
  ];

  const map = buildDirectoryMap(dirs);
  const formatted = formatDirectoryMap(map);

  assert.match(formatted, /### Directory Map/);
  assert.match(formatted, /- `src\/` \(1 file, 1 subdirectory\)/);
  assert.match(formatted, /  - `src\/commands\/` \(2 files\)/);
});

test("formatDirectoryMap handles empty directory list", () => {
  const formatted = formatDirectoryMap([]);
  assert.match(formatted, /No directories discovered/);
});

test("formatFileSize formats bytes, kilobytes, and megabytes", () => {
  assert.equal(formatFileSize(500), "500 B");
  assert.equal(formatFileSize(2048), "2.0 KB");
  assert.equal(formatFileSize(1024 * 1024 * 3.5), "3.5 MB");
});

test("buildFileMap groups files by directory and sorts deterministically", () => {
  const files = [
    createFileModel({ path: "src/cli.ts", relativePath: "src/cli.ts", name: "cli.ts", extension: ".ts", size: 1000, language: "TypeScript", isEntrypoint: true }),
    createFileModel({ path: "README.md", relativePath: "README.md", name: "README.md", extension: ".md", size: 200, language: "Markdown" }),
    createFileModel({ path: "src/commands/init.ts", relativePath: "src/commands/init.ts", name: "init.ts", extension: ".ts", size: 3000, language: "TypeScript" }),
  ];

  const groups = buildFileMap(files);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].directory, ".");
  assert.equal(groups[0].files.length, 1);
  assert.equal(groups[1].directory, "src");
  assert.equal(groups[1].files[0].isEntrypoint, true);
  assert.equal(groups[2].directory, "src/commands");
});

test("formatFileMap produces structured markdown with metadata", () => {
  const files = [
    createFileModel({ path: "src/cli.ts", relativePath: "src/cli.ts", name: "cli.ts", extension: ".ts", size: 1500, language: "TypeScript", isEntrypoint: true }),
  ];

  const groups = buildFileMap(files);
  const formatted = formatFileMap(groups);

  assert.match(formatted, /### File Map/);
  assert.match(formatted, /#### `src\/` \(1 file\)/);
  assert.match(formatted, /- `cli.ts` \(TypeScript, 1.5 KB, entry-point\)/);
});

test("detectModules identifies functional modules in src and top-level directories", () => {
  const dirs = [
    createDirectoryModel({ path: "src/core", relativePath: "src/core", name: "core" }),
    createDirectoryModel({ path: "src/commands", relativePath: "src/commands", name: "commands" }),
    createDirectoryModel({ path: "tests", relativePath: "tests", name: "tests" }),
  ];
  const files = [
    createFileModel({ path: "src/core/model.ts", relativePath: "src/core/model.ts", name: "model.ts", extension: ".ts", size: 1000, language: "TypeScript" }),
    createFileModel({ path: "src/commands/init.ts", relativePath: "src/commands/init.ts", name: "init.ts", extension: ".ts", size: 2000, language: "TypeScript" }),
    createFileModel({ path: "tests/cli.test.ts", relativePath: "tests/cli.test.ts", name: "cli.test.ts", extension: ".ts", size: 500, language: "TypeScript" }),
  ];

  const modules = detectModules(files, dirs);
  assert.equal(modules.length, 3);
  assert.equal(modules[0].name, "commands");
  assert.equal(modules[0].relativePath, "src/commands");
  assert.equal(modules[1].name, "core");
  assert.equal(modules[1].relativePath, "src/core");
  assert.equal(modules[2].name, "tests");
});

test("formatModuleMap produces readable markdown", () => {
  const modules = [
    {
      name: "core",
      relativePath: "src/core",
      fileCount: 4,
      languages: ["TypeScript"],
      hasEntrypoint: false,
      sampleFiles: ["model.ts"],
    },
    {
      name: "cli",
      relativePath: "src",
      fileCount: 1,
      languages: ["TypeScript"],
      hasEntrypoint: true,
      sampleFiles: ["cli.ts"],
    },
  ];

  const formatted = formatModuleMap(modules);
  assert.match(formatted, /### Module Map/);
  assert.match(formatted, /- \*\*`core`\*\* \(`src\/core\/`\) — 4 files \(TypeScript\)/);
  assert.match(formatted, /- \*\*`cli`\*\* \(`src\/`\) — 1 file \(TypeScript\) \[entry-point\]/);
});

test("inferEntryPointKind correctly categorizes entry points", () => {
  assert.equal(inferEntryPointKind("cli.ts", "src/cli.ts").kind, "cli");
  assert.equal(inferEntryPointKind("server.ts", "src/server.ts").kind, "server");
  assert.equal(inferEntryPointKind("main.dart", "lib/main.dart").kind, "app");
  assert.equal(inferEntryPointKind("index.ts", "src/index.ts").kind, "library");
});

test("buildEntryPointMap and formatEntryPointMap map entry points to markdown", () => {
  const files = [
    createFileModel({ path: "src/cli.ts", relativePath: "src/cli.ts", name: "cli.ts", extension: ".ts", size: 1000, language: "TypeScript" }),
    createFileModel({ path: "README.md", relativePath: "README.md", name: "README.md", extension: ".md", size: 500, language: "Markdown" }),
  ];

  const map = buildEntryPointMap(files);
  assert.equal(map.length, 1);
  assert.equal(map[0].relativePath, "src/cli.ts");
  assert.equal(map[0].kind, "cli");

  const formatted = formatEntryPointMap(map);
  assert.match(formatted, /### Entry Points/);
  assert.match(formatted, /- \*\*`src\/cli.ts`\*\* \[CLI\] — TypeScript, Command-Line Interface entry point/);
});
