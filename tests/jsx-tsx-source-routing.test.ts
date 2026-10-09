import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { isSourceFile } from "../src/router/source-file-router.js";
import { detectLanguageByExtension } from "../src/scanner/languages.js";
import { parseTaskQuery } from "../src/router/query.js";
import { executeRouting } from "../src/router/route-pipeline.js";
import { createContextInput, assembleContext } from "../src/context/context-selector.js";

test("A5 regression: .jsx and .tsx files are classified as source files and match language detection", () => {
  assert.equal(isSourceFile("src/components/Button.tsx"), true);
  assert.equal(isSourceFile("src/components/Modal.jsx"), true);

  assert.equal(detectLanguageByExtension(".tsx"), "TypeScript");
  assert.equal(detectLanguageByExtension(".jsx"), "JavaScript");

  // Verify consistency: all programming languages detected by extension must be source files
  const sampleFiles = [
    "src/App.tsx",
    "src/Item.jsx",
    "src/script.py",
    "src/main.rs",
    "src/server.go",
    "src/index.js",
    "src/module.ts",
  ];
  for (const sample of sampleFiles) {
    assert.equal(isSourceFile(sample), true, `${sample} must be classified as source file`);
  }
});

test("A5 regression: .jsx and .tsx files are eligible for routing and context selection", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-a5-jsx-"));
  try {
    const srcDir = path.join(tmpDir, "src", "components");
    fs.mkdirSync(srcDir, { recursive: true });

    const btnPath = path.join(srcDir, "Button.tsx");
    const modalPath = path.join(srcDir, "Modal.jsx");
    fs.writeFileSync(btnPath, "export const Button = () => <button>Click</button>;", "utf8");
    fs.writeFileSync(modalPath, "export const Modal = () => <div>Modal</div>;", "utf8");

    // Route query for Button
    const q1 = parseTaskQuery(["Button"]);
    assert.ok(q1);
    const r1 = executeRouting(tmpDir, q1);
    assert.ok(r1.sourceFiles.some((s) => s.path.includes("Button.tsx")));

    // Context query for Modal
    const q2 = parseTaskQuery(["Modal"]);
    assert.ok(q2);
    const ctxInput = createContextInput(tmpDir, q2);
    const payload = assembleContext(ctxInput);
    assert.ok(payload.items.some((it) => it.path.includes("Modal.jsx")));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
