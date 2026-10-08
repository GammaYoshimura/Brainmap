import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskQuery } from "../src/router/query.js";
import { routeRelevantDependencies } from "../src/router/dependency-router.js";
import { DependencyModel } from "../src/core/model.js";

const sampleDeps: DependencyModel[] = [
  { name: "typescript", version: "^5.7.0", kind: "development", manifestPath: "package.json" },
  { name: "@types/node", version: "^20.17.0", kind: "development", manifestPath: "package.json" },
  { name: "jsonwebtoken", version: "^9.0.0", kind: "production", manifestPath: "package.json" },
];

test("routeRelevantDependencies matches exact dependency name", () => {
  const query = parseTaskQuery("Verify jsonwebtoken authentication payload");
  assert.notEqual(query, null);

  const ranked = routeRelevantDependencies("/fake", query!, { dependencies: sampleDeps });
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].path, "jsonwebtoken@^9.0.0");
  assert.equal(ranked[0].score, 100);
});

test("routeRelevantDependencies matches unscoped package name", () => {
  const query = parseTaskQuery("Update node types configuration");
  assert.notEqual(query, null);

  const ranked = routeRelevantDependencies("/fake", query!, { dependencies: sampleDeps });
  assert.ok(ranked.length >= 1);
  const nodeDep = ranked.find((r) => r.path.startsWith("@types/node"));
  assert.notEqual(nodeDep, undefined);
});

test("routeRelevantDependencies returns empty array when query does not match any package", () => {
  const query = parseTaskQuery("Fix CSS button styling");
  assert.notEqual(query, null);

  const ranked = routeRelevantDependencies("/fake", query!, { dependencies: sampleDeps });
  assert.deepEqual(ranked, []);
});
