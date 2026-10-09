import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskQuery } from "../src/router/query.js";
import { createContextInput } from "../src/context/context-selector.js";
import { selectRelevantBrainDocuments } from "../src/context/brain-doc-selector.js";
import { selectRelevantSourceCode } from "../src/context/source-code-selector.js";
import { filterByRelevance, DEFAULT_MIN_RELEVANCE_SCORE } from "../src/context/relevance-filter.js";

test("createContextInput uses routing results as input", () => {
  const query = parseTaskQuery("Refactor query parser and check test runner");
  assert.notEqual(query, null);

  const contextInput = createContextInput(process.cwd(), query!);
  assert.equal(contextInput.projectRoot, process.cwd());
  assert.equal(contextInput.routeResult.query, "Refactor query parser and check test runner");
  assert.ok(Array.isArray(contextInput.routeResult.brainDocs));
  assert.ok(Array.isArray(contextInput.routeResult.sourceFiles));
  assert.ok(Array.isArray(contextInput.routeResult.tests));
});

test("selectRelevantBrainDocuments selects and loads brain documents", () => {
  const query = parseTaskQuery("architecture and state decisions");
  assert.notEqual(query, null);

  const contextInput = createContextInput(process.cwd(), query!);
  const docs = selectRelevantBrainDocuments(contextInput);

  assert.ok(docs.length > 0);
  assert.ok(docs[0].score > 0);
  assert.ok(docs[0].path.startsWith(".brain"));
  assert.ok(typeof docs[0].content === "string");
  assert.ok(docs[0].sizeBytes > 0);
});

test("selectRelevantSourceCode selects and loads source and test files", () => {
  const query = parseTaskQuery("cli entry point and test runner");
  assert.notEqual(query, null);

  const contextInput = createContextInput(process.cwd(), query!);
  const codeFiles = selectRelevantSourceCode(contextInput);

  assert.ok(codeFiles.length > 0);
  assert.ok(codeFiles[0].score > 0);
  assert.ok(typeof codeFiles[0].content === "string");
  assert.ok(codeFiles[0].sizeBytes > 0);
  assert.ok(typeof codeFiles[0].isTest === "boolean");
});

test("filterByRelevance and minRelevanceScore exclude low-relevance files", () => {
  const items = [
    { path: "high.ts", score: 80 },
    { path: "medium.ts", score: 45 },
    { path: "low.ts", score: 15 },
  ];

  const filtered = filterByRelevance(items, DEFAULT_MIN_RELEVANCE_SCORE);
  assert.equal(filtered.length, 2);
  assert.deepEqual(filtered.map((i) => i.path), ["high.ts", "medium.ts"]);

  const strictFiltered = filterByRelevance(items, 60);
  assert.equal(strictFiltered.length, 1);
  assert.equal(strictFiltered[0].path, "high.ts");
});
