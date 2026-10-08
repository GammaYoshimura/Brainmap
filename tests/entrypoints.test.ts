import test from "node:test";
import assert from "node:assert/strict";
import { isEntryPoint, detectEntryPoints, DEFAULT_ENTRY_POINT_RULES } from "../src/detector/entrypoints.js";

test("isEntryPoint detects default entry points and rejects ordinary files", () => {
  assert.equal(isEntryPoint("main.ts"), true);
  assert.equal(isEntryPoint("src/main.js"), true);
  assert.equal(isEntryPoint("index.ts"), true);
  assert.equal(isEntryPoint("src/index.py"), true);

  assert.equal(isEntryPoint("utils/helper.ts"), false);
  assert.equal(isEntryPoint("src/components/button.tsx"), false);
  assert.equal(isEntryPoint("data/users.json"), false);
});

test("detectEntryPoints filters entry points from list of paths", () => {
  const files = [
    "src/index.ts",
    "src/utils.ts",
    "main.py",
    "README.md",
  ];

  const entrypoints = detectEntryPoints(files);
  assert.deepEqual(entrypoints, ["src/index.ts", "main.py"]);
});

test("isEntryPoint supports custom rules", () => {
  const customRule = {
    id: "custom-worker",
    description: "Worker file",
    matches: (p: string) => p.endsWith("worker.ts"),
  };

  assert.equal(isEntryPoint("jobs/worker.ts", [customRule]), true);
  assert.equal(isEntryPoint("jobs/other.ts", [customRule]), false);
});
