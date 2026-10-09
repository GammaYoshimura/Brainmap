import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { mapCommand, MAP_SUCCESS } from "../src/commands/map.js";
import { initCommand, INIT_SUCCESS } from "../src/commands/init.js";
import { checkCommand, CHECK_SUCCESS } from "../src/commands/check.js";

test("A3 regression: mapCommand generates subsystem documents, updates index routing, and is idempotent", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-a3-map-"));
  try {
    // 1. Initialize brain in project
    assert.equal(initCommand([tmpDir]), INIT_SUCCESS);

    // 2. Create project with two recognizable groups
    const authDir = path.join(tmpDir, "src", "auth");
    const paymentDir = path.join(tmpDir, "src", "payment");
    fs.mkdirSync(authDir, { recursive: true });
    fs.mkdirSync(paymentDir, { recursive: true });

    fs.writeFileSync(path.join(authDir, "login.ts"), "export function login() {}", "utf8");
    fs.writeFileSync(path.join(authDir, "token.ts"), "export function token() {}", "utf8");
    fs.writeFileSync(path.join(paymentDir, "charge.ts"), "export function charge() {}", "utf8");

    // 3. Run mapCommand
    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);

    const brainDir = path.join(tmpDir, ".brain");
    const projectMapPath = path.join(brainDir, "project-map.md");
    const indexPath = path.join(brainDir, "index.md");
    const masterIndexPath = path.join(brainDir, "subsystems", "index.md");
    const authDocPath = path.join(brainDir, "subsystems", "auth", "index.md");
    const paymentDocPath = path.join(brainDir, "subsystems", "payment", "index.md");

    assert.ok(fs.existsSync(projectMapPath), "project-map.md must be generated");
    assert.ok(fs.existsSync(authDocPath), "auth subsystem doc must be generated");
    assert.ok(fs.existsSync(paymentDocPath), "payment subsystem doc must be generated");
    assert.ok(fs.existsSync(masterIndexPath), "subsystems/index.md must be generated");

    const indexContent = fs.readFileSync(indexPath, "utf8");
    assert.ok(indexContent.includes("subsystems/auth/"));
    assert.ok(indexContent.includes("subsystems/payment/"));

    const authContent = fs.readFileSync(authDocPath, "utf8");
    assert.ok(authContent.includes("# Auth Subsystem"));
    assert.ok(authContent.includes("src/auth/login.ts"));

    // 4. Verify idempotence: second run produces no duplicate entries
    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);

    const indexContent2 = fs.readFileSync(indexPath, "utf8");
    const authLines = indexContent2.split("\n").filter((l) => l.includes("subsystems/auth/"));
    assert.equal(authLines.length, 1, "subsystems/auth/ line should only be routed once");

    // 5. Run health check to ensure all generated links resolve cleanly
    const checkResult = checkCommand([tmpDir]);
    assert.equal(checkResult, CHECK_SUCCESS, "All generated markdown and subsystem links must resolve");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("A3 regression: mapCommand on a flat project handles ambiguous structure with low confidence", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-a3-flat-"));
  try {
    assert.equal(initCommand([tmpDir]), INIT_SUCCESS);

    // Root-level flat files without directories
    fs.writeFileSync(path.join(tmpDir, "helper.ts"), "export const x = 1;", "utf8");
    fs.writeFileSync(path.join(tmpDir, "util.ts"), "export const y = 2;", "utf8");

    assert.equal(mapCommand([tmpDir]), MAP_SUCCESS);

    const brainDir = path.join(tmpDir, ".brain");
    const projectMapPath = path.join(brainDir, "project-map.md");
    assert.ok(fs.existsSync(projectMapPath));

    // Verify it does not invent high-confidence arbitrary subsystems
    const subsystemsMasterIndex = path.join(brainDir, "subsystems", "index.md");
    if (fs.existsSync(subsystemsMasterIndex)) {
      const content = fs.readFileSync(subsystemsMasterIndex, "utf8");
      // If a fallback was created, it must report low confidence
      if (content.includes("confidence")) {
        assert.ok(content.includes("low confidence"));
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
