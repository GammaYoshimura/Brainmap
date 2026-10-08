import test from "node:test";
import assert from "node:assert/strict";
import { SubsystemGrouping } from "../src/subsystems/groupings.js";
import {
  identifyImportantSubsystemFiles,
  formatImportantFiles
} from "../src/subsystems/important-files.js";

test("identifyImportantSubsystemFiles scores domain-core, index, contracts, and entrypoints", () => {
  const grouping: SubsystemGrouping = {
    id: "scanner",
    name: "Scanner",
    path: "src/scanner",
    files: [
      {
        path: "C:/proj/src/scanner/exclusions.ts",
        relativePath: "src/scanner/exclusions.ts",
        name: "exclusions.ts",
        extension: ".ts",
        size: 50,
      },
      {
        path: "C:/proj/src/scanner/scanner.ts",
        relativePath: "src/scanner/scanner.ts",
        name: "scanner.ts",
        extension: ".ts",
        size: 150,
      },
      {
        path: "C:/proj/src/scanner/index.ts",
        relativePath: "src/scanner/index.ts",
        name: "index.ts",
        extension: ".ts",
        size: 20,
      },
      {
        path: "C:/proj/src/scanner/types.ts",
        relativePath: "src/scanner/types.ts",
        name: "types.ts",
        extension: ".ts",
        size: 30,
      },
      {
        path: "C:/proj/src/scanner/cli-run.ts",
        relativePath: "src/scanner/cli-run.ts",
        name: "cli-run.ts",
        extension: ".ts",
        size: 60,
        isEntrypoint: true,
      },
    ],
    directories: [],
    languages: ["TypeScript"],
    isEntryPointContainer: true,
    confidence: "high",
    reason: "Source directory",
  };

  const important = identifyImportantSubsystemFiles(grouping);

  assert.equal(important.length, 5);

  // Entrypoint should be #1 priority
  assert.equal(important[0].name, "cli-run.ts");
  assert.equal(important[0].role, "entry");

  // Domain-core (matching scanner) should be #2
  assert.equal(important[1].name, "scanner.ts");
  assert.equal(important[1].role, "domain-core");

  // Index should be #3
  assert.equal(important[2].name, "index.ts");
  assert.equal(important[2].role, "index");

  // Contracts (types.ts) should be #4
  assert.equal(important[3].name, "types.ts");
  assert.equal(important[3].role, "contracts");

  // General (exclusions.ts) should be #5
  assert.equal(important[4].name, "exclusions.ts");
  assert.equal(important[4].role, "general");
});

test("formatImportantFiles formats readable markdown lines", () => {
  const formatted = formatImportantFiles([
    {
      relativePath: "src/core/model.ts",
      name: "model.ts",
      role: "contracts",
      reason: "Type definitions and domain contracts",
      size: 500,
    },
  ]);

  assert.equal(formatted.length, 1);
  assert.equal(
    formatted[0],
    "- `src/core/model.ts` (contracts) — Type definitions and domain contracts"
  );
});

test("formatImportantFiles handles empty array", () => {
  const formatted = formatImportantFiles([]);
  assert.deepEqual(formatted, ["_No files discovered._"]);
});
