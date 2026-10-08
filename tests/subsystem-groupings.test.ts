import test from "node:test";
import assert from "node:assert/strict";
import { FileModel, DirectoryModel, ProjectModel } from "../src/core/model.js";
import {
  detectNaturalSubsystemGroupings,
  detectSubsystemGroupingsFromProject
} from "../src/subsystems/groupings.js";

test("detectNaturalSubsystemGroupings discovers subsystems under src/ container", () => {
  const files: FileModel[] = [
    {
      path: "C:/proj/src/scanner/scanner.ts",
      relativePath: "src/scanner/scanner.ts",
      name: "scanner.ts",
      extension: ".ts",
      size: 100,
      language: "TypeScript",
    },
    {
      path: "C:/proj/src/scanner/exclusions.ts",
      relativePath: "src/scanner/exclusions.ts",
      name: "exclusions.ts",
      extension: ".ts",
      size: 120,
      language: "TypeScript",
    },
    {
      path: "C:/proj/src/mapper/mapper.ts",
      relativePath: "src/mapper/mapper.ts",
      name: "mapper.ts",
      extension: ".ts",
      size: 150,
      language: "TypeScript",
    },
    {
      path: "C:/proj/src/cli.ts",
      relativePath: "src/cli.ts",
      name: "cli.ts",
      extension: ".ts",
      size: 80,
      language: "TypeScript",
      isEntrypoint: true,
    },
  ];

  const directories: DirectoryModel[] = [
    { path: "C:/proj/src", relativePath: "src", name: "src", fileCount: 1, subdirectories: ["scanner", "mapper"] },
    { path: "C:/proj/src/scanner", relativePath: "src/scanner", name: "scanner", fileCount: 2, subdirectories: [] },
    { path: "C:/proj/src/mapper", relativePath: "src/mapper", name: "mapper", fileCount: 1, subdirectories: [] },
  ];

  const groupings = detectNaturalSubsystemGroupings(files, directories);

  assert.equal(groupings.length, 3);
  const ids = groupings.map((g) => g.id);
  assert.ok(ids.includes("scanner"));
  assert.ok(ids.includes("mapper"));
  assert.ok(ids.includes("cli"));

  const scanner = groupings.find((g) => g.id === "scanner")!;
  assert.equal(scanner.name, "Scanner Subsystem");
  assert.equal(scanner.path, "src/scanner");
  assert.equal(scanner.files.length, 2);
  assert.equal(scanner.confidence, "high");

  const cli = groupings.find((g) => g.id === "cli")!;
  assert.equal(cli.isEntryPointContainer, true);
  assert.equal(cli.files.length, 1);
});

test("detectNaturalSubsystemGroupings discovers top-level functional directories", () => {
  const files: FileModel[] = [
    {
      path: "C:/proj/frontend/app.tsx",
      relativePath: "frontend/app.tsx",
      name: "app.tsx",
      extension: ".tsx",
      size: 300,
      language: "TypeScript",
    },
    {
      path: "C:/proj/backend/server.go",
      relativePath: "backend/server.go",
      name: "server.go",
      extension: ".go",
      size: 400,
      language: "Go",
      isEntrypoint: true,
    },
  ];

  const directories: DirectoryModel[] = [
    { path: "C:/proj/frontend", relativePath: "frontend", name: "frontend", fileCount: 1, subdirectories: [] },
    { path: "C:/proj/backend", relativePath: "backend", name: "backend", fileCount: 1, subdirectories: [] },
  ];

  const groupings = detectNaturalSubsystemGroupings(files, directories);
  assert.equal(groupings.length, 2);
  assert.equal(groupings[0].id, "backend");
  assert.equal(groupings[0].name, "Backend Subsystem");
  assert.equal(groupings[0].languages[0], "Go");
  assert.equal(groupings[1].id, "frontend");
  assert.equal(groupings[1].name, "Frontend Subsystem");
});

test("detectNaturalSubsystemGroupings ignores non-subsystem directories", () => {
  const files: FileModel[] = [
    {
      path: "C:/proj/.git/config",
      relativePath: ".git/config",
      name: "config",
      extension: "",
      size: 10,
    },
    {
      path: "C:/proj/node_modules/pkg/index.js",
      relativePath: "node_modules/pkg/index.js",
      name: "index.js",
      extension: ".js",
      size: 10,
    },
  ];

  const groupings = detectNaturalSubsystemGroupings(files, []);
  assert.equal(groupings.length, 0);
});

test("detectSubsystemGroupingsFromProject works end-to-end with ProjectModel", () => {
  const project: ProjectModel = {
    name: "Brainmap",
    rootPath: "C:/proj",
    createdAt: new Date().toISOString(),
    version: "1.0.0",
    files: [
      {
        path: "C:/proj/src/core/model.ts",
        relativePath: "src/core/model.ts",
        name: "model.ts",
        extension: ".ts",
        size: 50,
        language: "TypeScript",
      },
    ],
    directories: [
      { path: "C:/proj/src/core", relativePath: "src/core", name: "core", fileCount: 1, subdirectories: [] },
    ],
    dependencies: [],
    brainDocuments: [],
    diagnostics: [],
  };

  const groupings = detectSubsystemGroupingsFromProject(project);
  assert.equal(groupings.length, 1);
  assert.equal(groupings[0].id, "core");
  assert.equal(groupings[0].path, "src/core");
});

test("detectNaturalSubsystemGroupings falls back gracefully for flat projects", () => {
  const files: FileModel[] = [
    {
      path: "C:/proj/main.py",
      relativePath: "main.py",
      name: "main.py",
      extension: ".py",
      size: 50,
      language: "Python",
      isEntrypoint: true,
    },
  ];

  const groupings = detectNaturalSubsystemGroupings(files, [], "SimpleApp");
  assert.equal(groupings.length, 1);
  assert.equal(groupings[0].id, "simpleapp");
  assert.equal(groupings[0].name, "Simpleapp Subsystem");
  assert.equal(groupings[0].confidence, "low");
});
