import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scanCommand, SCAN_SUCCESS } from "../src/commands/scan.js";
import { updateCommand, UPDATE_SUCCESS } from "../src/commands/update.js";
import { mapCommand, MAP_SUCCESS } from "../src/commands/map.js";
import { loadPersistedScanState } from "../src/scanner/updater.js";

test("A2 regression: scan persists dependencies, update preserves them on unrelated edits, updates them on manifest changes, and removes them when manifest dependencies are cleared", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-a2-deps-"));

  try {
    const brainDir = path.join(tmpDir, ".brain");
    fs.mkdirSync(brainDir, { recursive: true });

    const pkgPath = path.join(tmpDir, "package.json");
    const srcPath = path.join(tmpDir, "index.ts");

    fs.writeFileSync(
      pkgPath,
      JSON.stringify({
        name: "test-pkg",
        dependencies: { express: "^4.18.2" },
      }, null, 2),
      "utf8"
    );
    fs.writeFileSync(srcPath, "console.log('v1');", "utf8");

    // 1. Initial scan
    assert.equal(scanCommand([tmpDir]), SCAN_SUCCESS);
    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);

    const map1 = fs.readFileSync(path.join(brainDir, "project-map.md"), "utf8");
    assert.ok(map1.includes("express"));
    assert.ok(map1.includes("**`express`** (`^4.18.2`)"));

    let state = loadPersistedScanState(tmpDir);
    assert.ok(state?.model?.dependencies);
    assert.equal(state?.model?.dependencies.length, 1);
    assert.equal(state?.model?.dependencies[0].name, "express");

    // 2. Modify an unrelated source file: dependencies must remain present
    fs.writeFileSync(srcPath, "console.log('v2 updated');", "utf8");
    assert.equal(updateCommand([tmpDir]), UPDATE_SUCCESS);

    state = loadPersistedScanState(tmpDir);
    assert.ok(state?.model?.dependencies);
    assert.equal(state?.model?.dependencies.length, 1);
    assert.equal(state?.model?.dependencies[0].name, "express");

    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);
    const map2 = fs.readFileSync(path.join(brainDir, "project-map.md"), "utf8");
    assert.ok(map2.includes("express"));

    // 3. Add a dependency to manifest
    fs.writeFileSync(
      pkgPath,
      JSON.stringify({
        name: "test-pkg",
        dependencies: { express: "^4.18.2", lodash: "^4.17.21" },
      }, null, 2),
      "utf8"
    );
    assert.equal(updateCommand([tmpDir]), UPDATE_SUCCESS);

    state = loadPersistedScanState(tmpDir);
    const depNames = state?.model?.dependencies.map((d) => d.name).sort();
    assert.deepEqual(depNames, ["express", "lodash"]);

    // 4. Remove all dependencies from manifest: old dependencies must disappear
    fs.writeFileSync(
      pkgPath,
      JSON.stringify({
        name: "test-pkg",
        dependencies: {},
      }, null, 2),
      "utf8"
    );
    assert.equal(updateCommand([tmpDir]), UPDATE_SUCCESS);

    state = loadPersistedScanState(tmpDir);
    assert.equal(state?.model?.dependencies.length, 0);

    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);
    const map3 = fs.readFileSync(path.join(brainDir, "project-map.md"), "utf8");
    assert.ok(!map3.includes("express"));
    assert.ok(!map3.includes("lodash"));
    assert.ok(map3.includes("- **Declared Dependencies**: 0"));

    // 5. Test migration from legacy scan.json lacking model
    fs.writeFileSync(
      pkgPath,
      JSON.stringify({
        name: "test-pkg",
        dependencies: { chalk: "^5.0.0" },
      }, null, 2),
      "utf8"
    );
    // Write legacy format without model property
    const legacyPayload = {
      summary: state?.summary,
      scannedAt: new Date().toISOString(),
      files: state?.files,
    };
    fs.writeFileSync(path.join(brainDir, "scan.json"), JSON.stringify(legacyPayload, null, 2), "utf8");

    // Loading should migrate/rebuild dependencies
    const migratedState = loadPersistedScanState(tmpDir);
    assert.ok(migratedState?.model);
    assert.ok(migratedState?.model?.dependencies);
    assert.equal(migratedState?.model?.dependencies.length, 1);
    assert.equal(migratedState?.model?.dependencies[0].name, "chalk");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
