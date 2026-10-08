import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { traverseProject, recordDiscoveredFiles } from "../src/scanner/scanner.js";
import { isEntryPoint, detectEntryPoints } from "../src/detector/entrypoints.js";
import {
  detectManifests,
  isManifest,
  collectDeclaredDependencies,
  recordDeclaredDependencies,
} from "../src/detector/manifests.js";

test("end-to-end project structure detection across multi-stack fixtures", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-detection-e2e-"));

  try {
    // 1. Flutter structure
    const flutterDir = path.join(tmpRoot, "mobile_app");
    fs.mkdirSync(path.join(flutterDir, "lib"), { recursive: true });
    fs.writeFileSync(path.join(flutterDir, "lib", "main.dart"), "void main() {}");
    fs.writeFileSync(
      path.join(flutterDir, "pubspec.yaml"),
      "name: mobile_app\nversion: 1.0.0\ndependencies:\n  flutter:\n    sdk: flutter\n  provider: ^6.0.0\n"
    );

    // 2. Node / TS backend
    const apiDir = path.join(tmpRoot, "backend_api");
    fs.mkdirSync(path.join(apiDir, "src"), { recursive: true });
    fs.writeFileSync(path.join(apiDir, "src", "server.ts"), "console.log('server');");
    fs.writeFileSync(
      path.join(apiDir, "package.json"),
      JSON.stringify({
        name: "backend-api",
        version: "2.0.0",
        dependencies: { fastify: "^4.26.0" },
        devDependencies: { typescript: "^5.3.0" },
      })
    );

    // 3. Rust microservice
    const rustDir = path.join(tmpRoot, "worker");
    fs.mkdirSync(path.join(rustDir, "src"), { recursive: true });
    fs.writeFileSync(path.join(rustDir, "src", "main.rs"), "fn main() {}");
    fs.writeFileSync(
      path.join(rustDir, "Cargo.toml"),
      "[package]\nname = \"worker\"\nversion = \"0.1.0\"\n[dependencies]\ntokio = \"1.0\"\n"
    );

    // 4. Python CLI
    const cliDir = path.join(tmpRoot, "cli_tool");
    fs.mkdirSync(cliDir, { recursive: true });
    fs.writeFileSync(path.join(cliDir, "main.py"), "print('cli')");
    fs.writeFileSync(path.join(cliDir, "requirements.txt"), "click>=8.0.0\nrich>=13.0.0\n");

    // Traverse and record
    const traversal = traverseProject(tmpRoot);
    const discoveredFiles = recordDiscoveredFiles(traversal.files, tmpRoot);

    // Verify Entry Point detection on discovered files
    const entryFiles = discoveredFiles.filter((f) => f.isEntrypoint);
    const entryRelPaths = entryFiles.map((f) => f.relativePath).sort();

    assert.ok(entryRelPaths.includes("mobile_app/lib/main.dart"));
    assert.ok(entryRelPaths.includes("backend_api/src/server.ts"));
    assert.ok(entryRelPaths.includes("worker/src/main.rs"));
    assert.ok(entryRelPaths.includes("cli_tool/main.py"));

    // Verify Manifest detection
    const manifests = detectManifests(discoveredFiles);
    const manifestKinds = manifests.map((m) => m.kind).sort();
    assert.ok(manifestKinds.includes("pubspec"));
    assert.ok(manifestKinds.includes("npm"));
    assert.ok(manifestKinds.includes("cargo"));
    assert.ok(manifestKinds.includes("python"));

    // Verify declared dependencies extraction
    const declaredDeps = collectDeclaredDependencies(discoveredFiles, tmpRoot);
    assert.ok(declaredDeps.some((d) => d.name === "provider" && d.kind === "production"));
    assert.ok(declaredDeps.some((d) => d.name === "fastify" && d.kind === "production"));
    assert.ok(declaredDeps.some((d) => d.name === "typescript" && d.kind === "development"));
    assert.ok(declaredDeps.some((d) => d.name === "tokio" && d.kind === "production"));
    assert.ok(declaredDeps.some((d) => d.name === "click" && d.kind === "production"));
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("manifest detection gracefully handles corrupted or unparseable files", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-corrupted-"));

  try {
    const corruptPkg = path.join(tmpDir, "package.json");
    fs.writeFileSync(corruptPkg, "{ invalid json ... ");

    const corruptCargo = path.join(tmpDir, "Cargo.toml");
    fs.writeFileSync(corruptCargo, "[[[not valid toml");

    assert.equal(isManifest("package.json"), true);
    assert.equal(isManifest("Cargo.toml"), true);

    const pkgDeps = recordDeclaredDependencies(corruptPkg, tmpDir);
    assert.deepEqual(pkgDeps, []);

    const cargoDeps = recordDeclaredDependencies(corruptCargo, tmpDir);
    assert.deepEqual(cargoDeps, []);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
