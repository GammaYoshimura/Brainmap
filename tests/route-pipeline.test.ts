import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskQuery } from "../src/router/query.js";
import {
  executeRouting,
  formatRouteResultText,
  formatRouteResultJson,
} from "../src/router/route-pipeline.js";

test("executeRouting synthesizes brainDocs, sourceFiles, adrs, tests, dependencies", () => {
  const query = parseTaskQuery("Refactor query parser and check test runner");
  assert.notEqual(query, null);

  const result = executeRouting(process.cwd(), query!);
  assert.equal(result.query, "Refactor query parser and check test runner");
  assert.equal(typeof result.projectRoot, "string");
  assert.ok(Array.isArray(result.brainDocs));
  assert.ok(Array.isArray(result.sourceFiles));
  assert.ok(Array.isArray(result.adrs));
  assert.ok(Array.isArray(result.tests));
  assert.ok(Array.isArray(result.dependencies));
});

test("formatRouteResultText formats readable output sections", () => {
  const query = parseTaskQuery("Check cli");
  const result = executeRouting(process.cwd(), query!);
  const text = formatRouteResultText(result);

  assert.match(text, /Route Results for:/);
  assert.match(text, /### Relevant Brain Documents/);
  assert.match(text, /### Relevant Source Files/);
  assert.match(text, /### Relevant Tests/);
});

test("formatRouteResultJson produces valid parseable JSON", () => {
  const query = parseTaskQuery("Verify architecture");
  const result = executeRouting(process.cwd(), query!);
  const jsonStr = formatRouteResultJson(result);
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.query, "Verify architecture");
  assert.ok(Array.isArray(parsed.brainDocs));
});
