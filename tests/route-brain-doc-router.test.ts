import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseTaskQuery } from "../src/router/query.js";
import {
  discoverBrainDocuments,
  inferDocumentRole,
  routeRelevantBrainDocs,
} from "../src/router/brain-doc-router.js";

test("inferDocumentRole infers correct roles from document paths", () => {
  assert.equal(inferDocumentRole(".brain/architecture.md"), "constitution");
  assert.equal(inferDocumentRole(".brain/state.md"), "state");
  assert.equal(inferDocumentRole(".brain/handoff.md"), "handoff");
  assert.equal(inferDocumentRole(".brain/index.md"), "router");
  assert.equal(inferDocumentRole(".brain/project-map.md"), "specialized");
  assert.equal(inferDocumentRole(".brain/decisions/0001-stack.md"), "decision");
  assert.equal(inferDocumentRole(".brain/subsystems/scanner/index.md"), "subsystem");
});

test("discoverBrainDocuments discovers all markdown files under .brain", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-route-braindocs-"));
  try {
    const brainDir = path.join(tmpDir, ".brain");
    fs.mkdirSync(path.join(brainDir, "subsystems", "core"), { recursive: true });
    fs.writeFileSync(path.join(brainDir, "architecture.md"), "# Architecture Constitution\n");
    fs.writeFileSync(path.join(brainDir, "subsystems", "core", "index.md"), "# Core Subsystem\n");

    const docs = discoverBrainDocuments(tmpDir);
    assert.equal(docs.length, 2);
    assert.equal(docs[0].title, "Architecture Constitution");
    assert.equal(docs[0].role, "constitution");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("routeRelevantBrainDocs returns ranked relevant Brain documents for query", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-route-braindocs-query-"));
  try {
    const brainDir = path.join(tmpDir, ".brain");
    fs.mkdirSync(path.join(brainDir, "subsystems", "scanner"), { recursive: true });
    fs.writeFileSync(path.join(brainDir, "architecture.md"), "# Architecture Constitution\n");
    fs.writeFileSync(path.join(brainDir, "state.md"), "# Project State\n");
    fs.writeFileSync(path.join(brainDir, "subsystems", "scanner", "index.md"), "# Scanner Subsystem\n");

    const query = parseTaskQuery("What are the architectural invariants and subsystem rules?");
    assert.notEqual(query, null);

    const relevant = routeRelevantBrainDocs(tmpDir, query!);
    assert.ok(relevant.length >= 1);
    assert.equal(relevant[0].path, ".brain/architecture.md");
    assert.ok(relevant[0].score >= 80);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("routeRelevantBrainDocs returns empty array when .brain does not exist", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-no-brain-"));
  try {
    const query = parseTaskQuery("Architecture");
    const docs = routeRelevantBrainDocs(tmpDir, query!);
    assert.deepEqual(docs, []);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
