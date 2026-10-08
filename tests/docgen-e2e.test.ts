import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  detectNaturalSubsystemGroupings,
  generateDocumentsForSubsystems,
  syncSubsystemRouting,
  generateSubsystemsIndex,
  generateSubsystemIndex
} from "../src/subsystems/index.js";
import { FileModel, DirectoryModel, DependencyModel } from "../src/core/model.js";

test("end-to-end specialized subsystem documentation generation on realistic multi-tier project", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-docgen-e2e-"));

  try {
    const srcCore = path.join(tmpDir, "src", "core");
    const srcScanner = path.join(tmpDir, "src", "scanner");
    const brainDir = path.join(tmpDir, ".brain");
    const brainSubsystems = path.join(brainDir, "subsystems");
    const brainDecisions = path.join(brainDir, "decisions");

    fs.mkdirSync(srcCore, { recursive: true });
    fs.mkdirSync(srcScanner, { recursive: true });
    fs.mkdirSync(brainSubsystems, { recursive: true });
    fs.mkdirSync(brainDecisions, { recursive: true });

    // 1. Files on disk
    fs.writeFileSync(
      path.join(srcCore, "model.ts"),
      "export interface ProjectData { name: string; }\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(srcCore, "contracts.ts"),
      "export interface ScannerContract { run(): void; }\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(srcCore, "index.ts"),
      "export * from './model.js';\nexport * from './contracts.js';\n",
      "utf8"
    );

    fs.writeFileSync(
      path.join(srcScanner, "scanner.ts"),
      `
import { ProjectData } from "../core/model.js";
import fastGlob from "fast-glob";
export function executeScan(): ProjectData { return { name: "test" }; }
`,
      "utf8"
    );
    fs.writeFileSync(
      path.join(srcScanner, "exclusions.ts"),
      "export const defaultIgnores = ['.git', 'node_modules'];\n",
      "utf8"
    );

    fs.writeFileSync(
      path.join(tmpDir, "src", "cli.ts"),
      `
import { executeScan } from "./scanner/scanner.js";
export function main() { executeScan(); }
`,
      "utf8"
    );

    // Initial .brain documents
    fs.writeFileSync(
      path.join(brainDir, "index.md"),
      "# Brain Index\n\n## Root Brain Documents\n\n- **[architecture.md](architecture.md)**: Constitution\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(brainDir, "architecture.md"),
      "# Architecture Constitution\n\nCore principles.\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(brainDecisions, "0001-deterministic-scanner.md"),
      "# ADR 0001: Deterministic Scanner\n\nScanner decisions.\n",
      "utf8"
    );

    // 2. Build models
    const files: FileModel[] = [
      {
        path: path.join(srcCore, "model.ts"),
        relativePath: "src/core/model.ts",
        name: "model.ts",
        extension: ".ts",
        size: 50,
        language: "TypeScript",
      },
      {
        path: path.join(srcCore, "contracts.ts"),
        relativePath: "src/core/contracts.ts",
        name: "contracts.ts",
        extension: ".ts",
        size: 60,
        language: "TypeScript",
      },
      {
        path: path.join(srcCore, "index.ts"),
        relativePath: "src/core/index.ts",
        name: "index.ts",
        extension: ".ts",
        size: 40,
        language: "TypeScript",
      },
      {
        path: path.join(srcScanner, "scanner.ts"),
        relativePath: "src/scanner/scanner.ts",
        name: "scanner.ts",
        extension: ".ts",
        size: 150,
        language: "TypeScript",
      },
      {
        path: path.join(srcScanner, "exclusions.ts"),
        relativePath: "src/scanner/exclusions.ts",
        name: "exclusions.ts",
        extension: ".ts",
        size: 70,
        language: "TypeScript",
      },
      {
        path: path.join(tmpDir, "src", "cli.ts"),
        relativePath: "src/cli.ts",
        name: "cli.ts",
        extension: ".ts",
        size: 90,
        language: "TypeScript",
        isEntrypoint: true,
      },
    ];

    const directories: DirectoryModel[] = [
      { path: path.join(tmpDir, "src"), relativePath: "src", name: "src", fileCount: 1, subdirectories: ["core", "scanner"] },
      { path: srcCore, relativePath: "src/core", name: "core", fileCount: 3, subdirectories: [] },
      { path: srcScanner, relativePath: "src/scanner", name: "scanner", fileCount: 2, subdirectories: [] },
    ];

    const declaredDeps: DependencyModel[] = [
      { name: "fast-glob", version: "^3.3.0", kind: "production" },
    ];

    // 3. Execution: Detect natural subsystem groupings
    const groupings = detectNaturalSubsystemGroupings(files, directories, "Brainmap");
    assert.equal(groupings.length, 3);
    const subIds = groupings.map((g) => g.id);
    assert.ok(subIds.includes("core"));
    assert.ok(subIds.includes("scanner"));
    assert.ok(subIds.includes("cli"));

    // 4. Execution: Generate documentation for all subsystems
    const optionsMap = {
      scanner: {
        declaredDependencies: declaredDeps,
        projectRoot: tmpDir,
        brainDir,
      },
      core: {
        brainDir,
      },
      cli: {
        brainDir,
      },
    };

    const generatedDocs = generateDocumentsForSubsystems(groupings, brainSubsystems, optionsMap);
    assert.equal(generatedDocs.length, 3);

    // Verify Core document
    const coreDoc = generatedDocs.find((d) => d.subsystemId === "core")!;
    assert.ok(coreDoc.content.includes("# Core Subsystem"));
    assert.ok(coreDoc.content.includes("src/core/contracts.ts"));
    assert.ok(coreDoc.content.includes("contracts"));
    assert.ok(coreDoc.content.includes("src/core/index.ts"));

    // Verify Scanner document
    const scannerDoc = generatedDocs.find((d) => d.subsystemId === "scanner")!;
    assert.ok(scannerDoc.content.includes("# Scanner Subsystem"));
    assert.ok(scannerDoc.content.includes("Core Subsystem"));
    assert.ok(scannerDoc.content.includes("[internal-subsystem]"));
    assert.ok(scannerDoc.content.includes("fast-glob"));
    assert.ok(scannerDoc.content.includes("[external-package]"));
    assert.ok(scannerDoc.content.includes("ADR 0001: Deterministic Scanner"));

    // Verify CLI document
    const cliDoc = generatedDocs.find((d) => d.subsystemId === "cli")!;
    assert.ok(cliDoc.content.includes("# CLI Subsystem"));
    assert.ok(cliDoc.content.includes("`src/cli.ts` [cli]"));

    // 5. Execution: Sync routing
    const routingResult = syncSubsystemRouting(brainDir, groupings);
    assert.equal(routingResult.indexUpdated, true);
    assert.ok(fs.existsSync(routingResult.masterIndexPath));

    // Verify master index
    const masterIndexContent = fs.readFileSync(routingResult.masterIndexPath, "utf8");
    assert.ok(masterIndexContent.includes("[Core Subsystem](core/index.md)"));
    assert.ok(masterIndexContent.includes("[Scanner Subsystem](scanner/index.md)"));
    assert.ok(masterIndexContent.includes("[CLI Subsystem](cli/index.md)"));

    // Verify global index.md
    const globalIndexContent = fs.readFileSync(path.join(brainDir, "index.md"), "utf8");
    assert.ok(globalIndexContent.includes("[subsystems/core/](subsystems/core/)"));
    assert.ok(globalIndexContent.includes("[subsystems/scanner/](subsystems/scanner/)"));
    assert.ok(globalIndexContent.includes("[subsystems/cli/](subsystems/cli/)"));

    // Verify idempotency of sync
    const reSync = syncSubsystemRouting(brainDir, groupings);
    assert.equal(reSync.indexUpdated, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("documentation generation handles empty project gracefully", () => {
  const groupings = detectNaturalSubsystemGroupings([], []);
  assert.equal(groupings.length, 0);

  const masterIndex = generateSubsystemsIndex([]);
  assert.ok(masterIndex.includes("_No subsystems defined or detected yet._"));
});
