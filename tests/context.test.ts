import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskQuery } from "../src/router/query.js";
import { createContextInput } from "../src/context/context-selector.js";
import { selectRelevantBrainDocuments } from "../src/context/brain-doc-selector.js";

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
