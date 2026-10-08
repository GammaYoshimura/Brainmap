import test from "node:test";
import assert from "node:assert/strict";
import { SubsystemGrouping } from "../src/subsystems/groupings.js";
import {
  recordSubsystemEntryPoints,
  formatSubsystemEntryPoints
} from "../src/subsystems/entrypoints.js";

test("recordSubsystemEntryPoints captures entrypoints, facades, and handlers", () => {
  const grouping: SubsystemGrouping = {
    id: "api",
    name: "API Subsystem",
    path: "src/api",
    files: [
      {
        path: "C:/proj/src/api/server.ts",
        relativePath: "src/api/server.ts",
        name: "server.ts",
        extension: ".ts",
        size: 200,
        isEntrypoint: true,
      },
      {
        path: "C:/proj/src/api/index.ts",
        relativePath: "src/api/index.ts",
        name: "index.ts",
        extension: ".ts",
        size: 50,
      },
      {
        path: "C:/proj/src/api/controllers/user.ts",
        relativePath: "src/api/controllers/user.ts",
        name: "user.ts",
        extension: ".ts",
        size: 120,
      },
      {
        path: "C:/proj/src/api/models/user.ts",
        relativePath: "src/api/models/user.ts",
        name: "user.ts",
        extension: ".ts",
        size: 80,
      },
    ],
    directories: [],
    languages: ["TypeScript"],
    isEntryPointContainer: true,
    confidence: "high",
    reason: "API directory",
  };

  const entrypoints = recordSubsystemEntryPoints(grouping);

  assert.equal(entrypoints.length, 3);

  const paths = entrypoints.map((e) => e.relativePath);
  assert.ok(paths.includes("src/api/server.ts"));
  assert.ok(paths.includes("src/api/index.ts"));
  assert.ok(paths.includes("src/api/controllers/user.ts"));

  const server = entrypoints.find((e) => e.relativePath === "src/api/server.ts")!;
  assert.equal(server.kind, "server");

  const index = entrypoints.find((e) => e.relativePath === "src/api/index.ts")!;
  assert.equal(index.kind, "library");

  const controller = entrypoints.find((e) => e.relativePath === "src/api/controllers/user.ts")!;
  assert.equal(controller.kind, "handler");
});

test("formatSubsystemEntryPoints formats markdown and handles empty entries", () => {
  const formatted = formatSubsystemEntryPoints([
    {
      relativePath: "src/cli.ts",
      name: "cli.ts",
      kind: "cli",
      description: "Command-Line Interface entry point",
    },
  ]);

  assert.equal(formatted.length, 1);
  assert.equal(
    formatted[0],
    "- `src/cli.ts` [cli] — Command-Line Interface entry point"
  );

  const empty = formatSubsystemEntryPoints([]);
  assert.deepEqual(empty, ["_No dedicated entry points detected in this subsystem._"]);
});
