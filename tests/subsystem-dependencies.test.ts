import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SubsystemGrouping } from "../src/subsystems/groupings.js";
import { DependencyModel } from "../src/core/model.js";
import {
  recordSubsystemDependencies,
  formatSubsystemDependencies
} from "../src/subsystems/dependencies.js";

test("recordSubsystemDependencies detects internal cross-subsystem and declared external dependencies", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-subsystem-dep-"));

  try {
    const scannerDir = path.join(tmpDir, "src", "scanner");
    const coreDir = path.join(tmpDir, "src", "core");
    fs.mkdirSync(scannerDir, { recursive: true });
    fs.mkdirSync(coreDir, { recursive: true });

    const scannerFile = path.join(scannerDir, "scanner.ts");
    fs.writeFileSync(
      scannerFile,
      `
import { ProjectModel } from "../core/model.js";
import fastGlob from "fast-glob";
import fs from "node:fs";

export function runScan() {}
`,
      "utf8"
    );

    const scannerGrouping: SubsystemGrouping = {
      id: "scanner",
      name: "Scanner Subsystem",
      path: "src/scanner",
      files: [
        {
          path: scannerFile,
          relativePath: "src/scanner/scanner.ts",
          name: "scanner.ts",
          extension: ".ts",
          size: 150,
        },
      ],
      directories: [],
      languages: ["TypeScript"],
      isEntryPointContainer: false,
      confidence: "high",
      reason: "Source directory",
    };

    const coreGrouping: SubsystemGrouping = {
      id: "core",
      name: "Core Subsystem",
      path: "src/core",
      files: [],
      directories: [],
      languages: ["TypeScript"],
      isEntryPointContainer: false,
      confidence: "high",
      reason: "Core models",
    };

    const declaredDeps: DependencyModel[] = [
      {
        name: "fast-glob",
        version: "^3.3.0",
        kind: "production",
      },
    ];

    const records = recordSubsystemDependencies(
      scannerGrouping,
      [scannerGrouping, coreGrouping],
      declaredDeps,
      tmpDir
    );

    assert.equal(records.length, 3);

    // 1. Internal subsystem dependency on core
    const internal = records.find((r) => r.kind === "internal-subsystem")!;
    assert.ok(internal);
    assert.equal(internal.target, "core");
    assert.equal(internal.name, "Core Subsystem");

    // 2. External dependency on fast-glob
    const external = records.find((r) => r.kind === "external-package")!;
    assert.ok(external);
    assert.equal(external.name, "fast-glob");
    assert.equal(external.target, "^3.3.0");

    // 3. Runtime dependency on node:fs
    const runtime = records.find((r) => r.kind === "runtime")!;
    assert.ok(runtime);
    assert.equal(runtime.name, "node:fs");

    // Test Markdown formatting
    const formatted = formatSubsystemDependencies(records);
    assert.ok(formatted[0].includes("Core Subsystem"));
    assert.ok(formatted[0].includes("[internal-subsystem]"));
    assert.ok(formatted[1].includes("fast-glob"));
    assert.ok(formatted[1].includes("[external-package]"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("formatSubsystemDependencies handles empty list", () => {
  const formatted = formatSubsystemDependencies([]);
  assert.deepEqual(formatted, ["_No external or internal subsystem dependencies detected._"]);
});
