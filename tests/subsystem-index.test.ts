import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  generateSubsystemIndex,
  generateSubsystemsIndex,
  writeSubsystemIndex,
  writeSubsystemsMasterIndex,
  type SubsystemIndexData
} from "../src/subsystems/subsystem-index.js";

test("generateSubsystemIndex formats valid markdown with documents", () => {
  const data: SubsystemIndexData = {
    id: "scanner",
    name: "Scanner",
    path: "src/scanner",
    description: "Deterministic filesystem traversal and exclusion management.",
    documents: [
      { name: "exclusions.md", path: "exclusions.md", description: "Ignore patterns and defaults" },
      { name: "languages.md", path: "languages.md" }
    ]
  };

  const md = generateSubsystemIndex(data);
  assert.ok(md.includes("# Scanner Subsystem"));
  assert.ok(md.includes("Deterministic filesystem traversal"));
  assert.ok(md.includes("- **Subsystem ID**: `scanner`"));
  assert.ok(md.includes("- **Source Path**: `src/scanner`"));
  assert.ok(md.includes("- [exclusions.md](exclusions.md): Ignore patterns and defaults"));
  assert.ok(md.includes("- [languages.md](languages.md)"));
});

test("generateSubsystemIndex handles empty documents list gracefully", () => {
  const data: SubsystemIndexData = {
    id: "core",
    name: "Core Subsystem",
    path: "src/core",
    description: "Internal data structures and domain representations."
  };

  const md = generateSubsystemIndex(data);
  assert.ok(md.includes("# Core Subsystem"));
  assert.ok(md.includes("_No specialized documents registered yet._"));
});

test("generateSubsystemsIndex formats master list sorted by id", () => {
  const subsystems: SubsystemIndexData[] = [
    {
      id: "scanner",
      name: "Scanner Subsystem",
      path: "src/scanner",
      description: "Traversal and ignore rules."
    },
    {
      id: "core",
      name: "Core",
      path: "src/core",
      description: "Domain entities."
    }
  ];

  const md = generateSubsystemsIndex(subsystems);
  assert.ok(md.includes("# Subsystems Index"));
  const corePos = md.indexOf("Core Subsystem");
  const scannerPos = md.indexOf("Scanner Subsystem");
  assert.ok(corePos !== -1 && scannerPos !== -1);
  assert.ok(corePos < scannerPos, "Expected alphabetical sort by id");
  assert.ok(md.includes("[Core Subsystem](core/index.md)"));
  assert.ok(md.includes("[Scanner Subsystem](scanner/index.md)"));
});

test("generateSubsystemsIndex handles empty list", () => {
  const md = generateSubsystemsIndex([]);
  assert.ok(md.includes("_No subsystems defined or detected yet._"));
});

test("writeSubsystemIndex and writeSubsystemsMasterIndex write to disk", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-subsystem-test-"));
  try {
    const sub: SubsystemIndexData = {
      id: "mapper",
      name: "Mapper",
      path: "src/mapper",
      description: "Structural mapping"
    };

    const subFile = writeSubsystemIndex(tmpDir, sub);
    assert.ok(fs.existsSync(subFile));
    assert.equal(fs.readFileSync(subFile, "utf8"), generateSubsystemIndex(sub));

    const masterFile = writeSubsystemsMasterIndex(tmpDir, [sub]);
    assert.ok(fs.existsSync(masterFile));
    assert.equal(fs.readFileSync(masterFile, "utf8"), generateSubsystemsIndex([sub]));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
