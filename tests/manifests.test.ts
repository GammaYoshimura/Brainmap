import test from "node:test";
import assert from "node:assert/strict";
import {
  isManifest,
  identifyManifest,
  detectManifests,
  registerManifestRule,
  MANIFEST_RULES,
  isPackageJson,
  parsePackageJson,
} from "../src/detector/manifests.js";

test("detects package.json correctly", () => {
  assert.equal(isPackageJson("package.json"), true);
  assert.equal(isPackageJson("packages/core/package.json"), true);
  assert.equal(isPackageJson("package.json.bak"), false);

  assert.equal(isManifest("package.json"), true);
  assert.equal(isManifest("nested/package.json"), true);

  const descriptor = identifyManifest("package.json");
  assert.ok(descriptor);
  assert.equal(descriptor?.kind, "npm");
  assert.equal(descriptor?.ecosystem, "Node.js");

  const parsed = parsePackageJson(JSON.stringify({
    name: "my-package",
    version: "1.2.3",
    dependencies: { "express": "^4.18.2" },
  }));
  assert.ok(parsed);
  assert.equal(parsed?.name, "my-package");
  assert.equal(parsed?.version, "1.2.3");
  assert.equal(parsed?.dependencies?.["express"], "^4.18.2");
});

test("manifest detection foundation registers and matches rules", () => {
  // Initially or with test rule
  const initialCount = MANIFEST_RULES.length;
  registerManifestRule({
    kind: "generic",
    ecosystem: "TestEcosystem",
    matches: (fileName) => fileName === "test.manifest",
  });

  assert.equal(isManifest("test.manifest"), true);
  assert.equal(isManifest("sub/test.manifest"), true);
  assert.equal(isManifest("other.txt"), false);

  const descriptor = identifyManifest("sub/test.manifest");
  assert.ok(descriptor);
  assert.equal(descriptor?.kind, "generic");
  assert.equal(descriptor?.ecosystem, "TestEcosystem");
  assert.equal(descriptor?.fileName, "test.manifest");

  const detected = detectManifests(["test.manifest", "other.txt", "sub/test.manifest"]);
  assert.equal(detected.length, 2);

  // Clean up test rule
  MANIFEST_RULES.splice(initialCount, 1);
});
