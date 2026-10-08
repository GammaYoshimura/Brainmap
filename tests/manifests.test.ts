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
  isPubspecYaml,
  parsePubspecYaml,
  isComposerJson,
  parseComposerJson,
  isPythonManifest,
  parseRequirementsTxt,
  parsePyprojectToml,
} from "../src/detector/manifests.js";

test("detects common Python manifests correctly", () => {
  assert.equal(isPythonManifest("pyproject.toml"), true);
  assert.equal(isPythonManifest("requirements.txt"), true);
  assert.equal(isPythonManifest("requirements-dev.txt"), true);
  assert.equal(isPythonManifest("setup.py"), true);
  assert.equal(isPythonManifest("setup.cfg"), true);
  assert.equal(isPythonManifest("Pipfile"), true);
  assert.equal(isPythonManifest("requirements.in"), false);

  assert.equal(isManifest("pyproject.toml"), true);
  assert.equal(isManifest("requirements.txt"), true);

  const descriptor = identifyManifest("pyproject.toml");
  assert.ok(descriptor);
  assert.equal(descriptor?.kind, "python");
  assert.equal(descriptor?.ecosystem, "Python");

  const sampleReqs = `
# Core dependencies
fastapi>=0.100.0
uvicorn[standard]==0.22.0
requests
# Dev dependencies
pytest>=7.0.0
`;
  const reqs = parseRequirementsTxt(sampleReqs);
  assert.equal(reqs["fastapi"], ">=0.100.0");
  assert.equal(reqs["uvicorn"], "==0.22.0");
  assert.equal(reqs["requests"], "*");
  assert.equal(reqs["pytest"], ">=7.0.0");

  const samplePyproject = `
[project]
name = "my-fastapi-app"
version = "0.1.0"

[project.dependencies]
fastapi = ">=0.100.0"
httpx = "^0.24.0"

[project.optional-dependencies]
pytest = ">=7.4.0"
`;
  const pyproject = parsePyprojectToml(samplePyproject);
  assert.ok(pyproject);
  assert.equal(pyproject?.name, "my-fastapi-app");
  assert.equal(pyproject?.version, "0.1.0");
  assert.equal(pyproject?.dependencies?.["fastapi"], ">=0.100.0");
  assert.equal(pyproject?.dependencies?.["httpx"], "^0.24.0");
  assert.equal(pyproject?.devDependencies?.["pytest"], ">=7.4.0");
});

test("detects composer.json correctly", () => {
  assert.equal(isComposerJson("composer.json"), true);
  assert.equal(isComposerJson("backend/composer.json"), true);
  assert.equal(isComposerJson("composer.lock"), false);

  assert.equal(isManifest("composer.json"), true);

  const descriptor = identifyManifest("composer.json");
  assert.ok(descriptor);
  assert.equal(descriptor?.kind, "composer");
  assert.equal(descriptor?.ecosystem, "PHP");

  const sampleComposer = JSON.stringify({
    name: "laravel/laravel",
    description: "The skeleton application for the Laravel framework.",
    type: "project",
    require: {
      "php": "^8.2",
      "laravel/framework": "^11.0",
    },
    "require-dev": {
      "phpunit/phpunit": "^11.0.1",
    },
  });

  const parsed = parseComposerJson(sampleComposer);
  assert.ok(parsed);
  assert.equal(parsed?.name, "laravel/laravel");
  assert.equal(parsed?.type, "project");
  assert.equal(parsed?.require?.["laravel/framework"], "^11.0");
  assert.equal(parsed?.requireDev?.["phpunit/phpunit"], "^11.0.1");
});

test("detects pubspec.yaml correctly", () => {
  assert.equal(isPubspecYaml("pubspec.yaml"), true);
  assert.equal(isPubspecYaml("pubspec.yml"), true);
  assert.equal(isPubspecYaml("packages/app/pubspec.yaml"), true);
  assert.equal(isPubspecYaml("pubspec.lock"), false);

  assert.equal(isManifest("pubspec.yaml"), true);

  const descriptor = identifyManifest("pubspec.yaml");
  assert.ok(descriptor);
  assert.equal(descriptor?.kind, "pubspec");
  assert.equal(descriptor?.ecosystem, "Dart/Flutter");

  const sampleYaml = `
name: flutter_weather
description: A weather flutter app.
version: 1.0.0+1

dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0
  provider: ^6.1.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
`;

  const parsed = parsePubspecYaml(sampleYaml);
  assert.ok(parsed);
  assert.equal(parsed?.name, "flutter_weather");
  assert.equal(parsed?.version, "1.0.0+1");
  assert.equal(parsed?.description, "A weather flutter app.");
  assert.equal(parsed?.dependencies?.["http"], "^1.2.0");
  assert.equal(parsed?.dependencies?.["provider"], "^6.1.1");
  assert.equal(parsed?.devDependencies?.["flutter_lints"], "^3.0.0");
});

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
