import test from "node:test";
import assert from "node:assert/strict";
import { createDirectoryModel } from "../src/core/model.js";
import { buildDirectoryMap, formatDirectoryMap } from "../src/mapper/directory-map.js";

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
