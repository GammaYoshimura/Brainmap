import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initCommand, INIT_SUCCESS } from "../src/commands/init.js";
import { scanCommand, SCAN_SUCCESS } from "../src/commands/scan.js";
import { mapCommand, MAP_SUCCESS } from "../src/commands/map.js";
import { updateCommand, UPDATE_SUCCESS } from "../src/commands/update.js";
import { routeCommand, ROUTE_SUCCESS } from "../src/commands/route.js";
import { contextCommand, CONTEXT_SUCCESS } from "../src/commands/context.js";
import { checkCommand, CHECK_SUCCESS, CHECK_FAILURE } from "../src/commands/check.js";
import { parseTaskQuery } from "../src/router/query.js";
import { executeRouting } from "../src/router/route-pipeline.js";
import { createContextInput, assembleContext } from "../src/context/context-selector.js";

test("D1 Acceptance: Incremental update correctness", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-d1-"));
  try {
    const pkgJson = path.join(tmpDir, "package.json");
    const srcFile = path.join(tmpDir, "service.ts");

    fs.writeFileSync(
      pkgJson,
      JSON.stringify({
        name: "test-d1",
        dependencies: { axios: "^1.6.0" },
      }, null, 2),
      "utf8"
    );
    // 25 characters: "export const flag = true;"
    fs.writeFileSync(srcFile, "export const flag = true;", "utf8");

    assert.equal(initCommand([tmpDir]), INIT_SUCCESS);
    assert.equal(scanCommand([tmpDir]), SCAN_SUCCESS);
    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);

    const map1 = fs.readFileSync(path.join(tmpDir, ".brain", "project-map.md"), "utf8");
    assert.ok(map1.includes("axios"));

    // Modify service.ts without changing byte length: "export const flag = fals;"
    fs.writeFileSync(srcFile, "export const flag = fals;", "utf8");
    assert.equal(updateCommand([tmpDir]), UPDATE_SUCCESS);
    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);

    // Remove dependency from manifest
    fs.writeFileSync(
      pkgJson,
      JSON.stringify({
        name: "test-d1",
        dependencies: {},
      }, null, 2),
      "utf8"
    );
    assert.equal(updateCommand([tmpDir]), UPDATE_SUCCESS);
    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);

    const map2 = fs.readFileSync(path.join(tmpDir, ".brain", "project-map.md"), "utf8");
    assert.ok(!map2.includes("axios"));
    assert.ok(map2.includes("- **Declared Dependencies**: 0"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("D2 Acceptance: Subsystem routing and context with TSX/JSX participation", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-d2-"));
  try {
    assert.equal(initCommand([tmpDir]), INIT_SUCCESS);

    const authDir = path.join(tmpDir, "src", "auth");
    fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(path.join(authDir, "crypto.ts"), "export const hash = () => 'h';", "utf8");
    fs.writeFileSync(path.join(authDir, "LoginDialog.tsx"), "export const LoginDialog = () => null;", "utf8");

    const otherDir = path.join(tmpDir, "src", "reports");
    fs.mkdirSync(otherDir, { recursive: true });
    fs.writeFileSync(path.join(otherDir, "pdf.ts"), "export const render = () => null;", "utf8");

    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);

    const query = parseTaskQuery(["auth"]);
    assert.ok(query);

    const routeRes = executeRouting(tmpDir, query);
    const sourceFiles = routeRes.sourceFiles.map((s) => s.path);
    assert.ok(sourceFiles.some((f) => f.includes("crypto.ts")));
    assert.ok(sourceFiles.some((f) => f.includes("LoginDialog.tsx")));

    const ctxInput = createContextInput(tmpDir, query, { maxCharacters: 5000 });
    const payload = assembleContext(ctxInput);
    assert.ok(payload.items.some((it) => it.path.includes("LoginDialog.tsx")));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("D3 Acceptance: Idempotence and integrity with brainmap check", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-d3-"));
  try {
    assert.equal(initCommand([tmpDir]), INIT_SUCCESS);

    const srcDir = path.join(tmpDir, "src", "core");
    fs.mkdirSync(srcDir, { recursive: true });
    const mainFile = path.join(srcDir, "main.ts");
    fs.writeFileSync(mainFile, "export const x = 1;", "utf8");

    // First map run
    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);
    // Second map run without changes
    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);

    // Integrity check
    assert.equal(checkCommand([tmpDir]), CHECK_SUCCESS);

    // Delete source file
    fs.rmSync(mainFile);

    // checkCommand should detect unreflected / stale state
    assert.equal(checkCommand([tmpDir]), CHECK_FAILURE);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
