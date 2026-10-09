import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initCommand, INIT_SUCCESS } from "../src/commands/init.js";
import { mapCommand, MAP_SUCCESS } from "../src/commands/map.js";
import { routeCommand, ROUTE_SUCCESS } from "../src/commands/route.js";
import { parseTaskQuery } from "../src/router/query.js";
import { executeRouting } from "../src/router/route-pipeline.js";

test("A4 regression: task query matching subsystem name routes files that lack subsystem keywords in their filename", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-a4-route-"));
  try {
    assert.equal(initCommand([tmpDir]), INIT_SUCCESS);

    // Create authentication subsystem with files NOT containing 'auth'
    const authDir = path.join(tmpDir, "src", "authentication");
    fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(path.join(authDir, "crypto-tokens.ts"), "export const verifyToken = () => true;", "utf8");
    fs.writeFileSync(path.join(authDir, "user-session.ts"), "export const getSession = () => ({ id: 1 });", "utf8");

    // Create an unrelated subsystem
    const billingDir = path.join(tmpDir, "src", "billing");
    fs.mkdirSync(billingDir, { recursive: true });
    fs.writeFileSync(path.join(billingDir, "invoice.ts"), "export const invoice = () => true;", "utf8");

    // Map project so subsystem documentation and routing is initialized
    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);

    // Query for "change authentication"
    const query = parseTaskQuery(["change", "authentication"]);
    assert.ok(query);

    const result = executeRouting(tmpDir, query);

    // Source files should include crypto-tokens.ts and user-session.ts via subsystem match
    const sourcePaths = result.sourceFiles.map((s) => s.path);
    assert.ok(
      sourcePaths.some((p) => p.includes("crypto-tokens.ts")),
      "crypto-tokens.ts should be routed via authentication subsystem match"
    );
    assert.ok(
      sourcePaths.some((p) => p.includes("user-session.ts")),
      "user-session.ts should be routed via authentication subsystem match"
    );

    // Check reasons and scores explain the selection
    const cryptoItem = result.sourceFiles.find((s) => s.path.includes("crypto-tokens.ts"));
    assert.ok(cryptoItem);
    assert.ok(cryptoItem.reasons.some((r) => r.includes("subsystem match")));
    assert.ok(cryptoItem.score > 0);

    // Verify unrelated billing files do not dominate or match authentication
    const billingItem = result.sourceFiles.find((s) => s.path.includes("invoice.ts"));
    assert.equal(billingItem, undefined, "Unrelated billing files must not match authentication query");

    // CLI dispatch test
    assert.equal(routeCommand(["change", "authentication", "--json"]), ROUTE_SUCCESS);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
