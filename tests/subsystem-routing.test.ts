import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SubsystemGrouping } from "../src/subsystems/groupings.js";
import {
  ensureSubsystemRoutingInIndex,
  ensureSubsystemsMasterIndex,
  syncSubsystemRouting
} from "../src/subsystems/routing.js";

test("ensureSubsystemRoutingInIndex inserts new subsystem router links without duplicating", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-subsystem-routing-"));

  try {
    const brainDir = path.join(tmpDir, ".brain");
    fs.mkdirSync(brainDir, { recursive: true });

    const initialIndex = `# Brain Index

Global router for Brainmap project knowledge.

## Root Brain Documents

- **[architecture.md](architecture.md)**: Constitution
- **[subsystems/](subsystems/)**: Subsystems directory
  - **[subsystems/scanner/](subsystems/scanner/)**: Scanner context
`;
    fs.writeFileSync(path.join(brainDir, "index.md"), initialIndex, "utf8");

    const groupings: SubsystemGrouping[] = [
      {
        id: "scanner",
        name: "Scanner Subsystem",
        path: "src/scanner",
        files: [],
        directories: [],
        languages: [],
        isEntryPointContainer: false,
        confidence: "high",
        reason: "Source dir",
      },
      {
        id: "mapper",
        name: "Mapper Subsystem",
        path: "src/mapper",
        files: [],
        directories: [],
        languages: [],
        isEntryPointContainer: false,
        confidence: "high",
        reason: "Source dir",
      },
    ];

    // First run should add mapper (scanner is already present)
    const updated = ensureSubsystemRoutingInIndex(brainDir, groupings);
    assert.equal(updated, true);

    const indexContent = fs.readFileSync(path.join(brainDir, "index.md"), "utf8");
    assert.ok(indexContent.includes("[subsystems/mapper/](subsystems/mapper/)"));
    assert.ok(indexContent.includes("[subsystems/scanner/](subsystems/scanner/)"));

    // Second run should be a no-op (idempotent)
    const updatedAgain = ensureSubsystemRoutingInIndex(brainDir, groupings);
    assert.equal(updatedAgain, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("ensureSubsystemsMasterIndex creates and populates master index", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-subsystem-master-"));

  try {
    const brainDir = path.join(tmpDir, ".brain");
    fs.mkdirSync(brainDir, { recursive: true });

    const groupings: SubsystemGrouping[] = [
      {
        id: "core",
        name: "Core",
        path: "src/core",
        files: [],
        directories: [],
        languages: [],
        isEntryPointContainer: false,
        confidence: "high",
        reason: "Source dir",
      },
    ];

    const masterPath = ensureSubsystemsMasterIndex(brainDir, groupings);
    assert.ok(fs.existsSync(masterPath));

    const content = fs.readFileSync(masterPath, "utf8");
    assert.ok(content.includes("# Subsystems Index"));
    assert.ok(content.includes("[Core Subsystem](core/index.md)"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("syncSubsystemRouting coordinates both index updates", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-subsystem-sync-"));

  try {
    const brainDir = path.join(tmpDir, ".brain");
    fs.mkdirSync(brainDir, { recursive: true });
    fs.writeFileSync(
      path.join(brainDir, "index.md"),
      "# Brain Index\n\n## Root Brain Documents\n",
      "utf8"
    );

    const groupings: SubsystemGrouping[] = [
      {
        id: "cli",
        name: "CLI",
        path: "src",
        files: [],
        directories: [],
        languages: [],
        isEntryPointContainer: true,
        confidence: "medium",
        reason: "CLI dir",
      },
    ];

    const result = syncSubsystemRouting(brainDir, groupings);
    assert.equal(result.indexUpdated, true);
    assert.ok(fs.existsSync(result.masterIndexPath));

    const indexContent = fs.readFileSync(path.join(brainDir, "index.md"), "utf8");
    assert.ok(indexContent.includes("[subsystems/cli/](subsystems/cli/)"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
