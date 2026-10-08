import test from "node:test";
import assert from "node:assert/strict";
import {
  isManifest,
  identifyManifest,
  detectManifests,
  registerManifestRule,
  MANIFEST_RULES,
} from "../src/detector/manifests.js";

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
