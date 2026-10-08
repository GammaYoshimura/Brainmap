import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SubsystemGrouping } from "../src/subsystems/groupings.js";
import {
  generateSubsystemDocument,
  generateDocumentsForSubsystems
} from "../src/subsystems/generator.js";

test("generateSubsystemDocument formats comprehensive markdown for a grouping", () => {
  const grouping: SubsystemGrouping = {
    id: "scanner",
    name: "Scanner Subsystem",
    path: "src/scanner",
    files: [
      {
        path: "C:/proj/src/scanner/scanner.ts",
        relativePath: "src/scanner/scanner.ts",
        name: "scanner.ts",
        extension: ".ts",
        size: 150,
        language: "TypeScript",
      },
      {
        path: "C:/proj/src/scanner/exclusions.ts",
        relativePath: "src/scanner/exclusions.ts",
        name: "exclusions.ts",
        extension: ".ts",
        size: 100,
        language: "TypeScript",
      },
    ],
    directories: [],
    languages: ["TypeScript"],
    isEntryPointContainer: false,
    confidence: "high",
    reason: "Dedicated directory under src/",
  };

  const md = generateSubsystemDocument(grouping);

  assert.ok(md.includes("# Scanner Subsystem"));
  assert.ok(md.includes("- **Subsystem ID**: `scanner`"));
  assert.ok(md.includes("- **Location**: `src/scanner`"));
  assert.ok(md.includes("- **Files Count**: 2"));
  assert.ok(md.includes("- **Primary Languages**: TypeScript"));
  assert.ok(md.includes("## Important Files"));
  assert.ok(md.includes("src/scanner/scanner.ts"));
  assert.ok(md.includes("src/scanner/exclusions.ts"));
  assert.ok(md.includes("## Entry Points"));
  assert.ok(md.includes("## Subsystem Dependencies"));
  assert.ok(md.includes("## Related Brain Documents"));
});

test("generateDocumentsForSubsystems writes document for each detected subsystem", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-subsystem-gen-"));
  try {
    const groupings: SubsystemGrouping[] = [
      {
        id: "core",
        name: "Core",
        path: "src/core",
        files: [
          {
            path: "C:/proj/src/core/model.ts",
            relativePath: "src/core/model.ts",
            name: "model.ts",
            extension: ".ts",
            size: 50,
          },
        ],
        directories: [],
        languages: ["TypeScript"],
        isEntryPointContainer: false,
        confidence: "high",
        reason: "Source directory",
      },
      {
        id: "cli",
        name: "CLI",
        path: "src",
        files: [
          {
            path: "C:/proj/src/cli.ts",
            relativePath: "src/cli.ts",
            name: "cli.ts",
            extension: ".ts",
            size: 80,
            isEntrypoint: true,
          },
        ],
        directories: [],
        languages: ["TypeScript"],
        isEntryPointContainer: true,
        confidence: "medium",
        reason: "Entrypoint container",
      },
    ];

    const generated = generateDocumentsForSubsystems(groupings, tmpDir);

    assert.equal(generated.length, 2);
    assert.equal(generated[0].subsystemId, "core");
    assert.equal(generated[1].subsystemId, "cli");

    const coreFile = path.join(tmpDir, "core", "index.md");
    const cliFile = path.join(tmpDir, "cli", "index.md");

    assert.ok(fs.existsSync(coreFile));
    assert.ok(fs.existsSync(cliFile));

    const coreContent = fs.readFileSync(coreFile, "utf8");
    assert.ok(coreContent.includes("# Core Subsystem"));

    const cliContent = fs.readFileSync(cliFile, "utf8");
    assert.ok(cliContent.includes("# CLI Subsystem"));
    assert.ok(cliContent.includes("`src/cli.ts` [entry-point]"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
