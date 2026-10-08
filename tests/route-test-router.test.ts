import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskQuery } from "../src/router/query.js";
import { routeRelevantTests } from "../src/router/test-router.js";

const sampleFiles = [
  "src/cli.ts",
  "src/router/query.ts",
  "tests/cli.test.ts",
  "tests/route-query.test.ts",
  "tests/scanner.test.ts",
];

test("routeRelevantTests matches test files directly mentioned in query", () => {
  const query = parseTaskQuery("Fix assertions in tests/cli.test.ts");
  assert.notEqual(query, null);

  const ranked = routeRelevantTests("/fake", query!, { files: sampleFiles });
  assert.ok(ranked.length >= 1);
  assert.equal(ranked[0].path, "tests/cli.test.ts");
  assert.equal(ranked[0].score, 100);
});

test("routeRelevantTests links test files corresponding to relevant source files", () => {
  const query = parseTaskQuery("Refactor query parser options");
  assert.notEqual(query, null);

  const ranked = routeRelevantTests("/fake", query!, {
    files: sampleFiles,
    relevantSourceFiles: ["src/router/query.ts"],
  });

  assert.ok(ranked.length >= 1);
  assert.equal(ranked[0].path, "tests/route-query.test.ts");
  assert.ok(ranked[0].reasons.some((r) => r.includes("src/router/query.ts")));
});

test("routeRelevantTests returns empty array when no tests match", () => {
  const query = parseTaskQuery("Setup kubernetes ingress controller");
  assert.notEqual(query, null);

  const ranked = routeRelevantTests("/fake", query!, { files: sampleFiles });
  assert.deepEqual(ranked, []);
});
