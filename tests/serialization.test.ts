import test from "node:test";
import assert from "node:assert/strict";
import {
  createProjectModel,
  createFileModel,
  createDirectoryModel,
  createDependencyModel,
  createBrainDocumentModel,
  createDiagnosticModel,
  serializeProjectModel,
  deserializeProjectModel,
} from "../src/core/model.js";

test("serialize and deserialize roundtrip preserves all ProjectModel fields", () => {
  const model = createProjectModel("TestApp", "C:/Projects/TestApp");
  model.files.push(
    createFileModel({
      path: "C:/Projects/TestApp/src/index.ts",
      relativePath: "src/index.ts",
      name: "index.ts",
      extension: ".ts",
      size: 120,
      language: "typescript",
      isEntrypoint: true,
    })
  );
  model.directories.push(
    createDirectoryModel({
      path: "C:/Projects/TestApp/src",
      relativePath: "src",
      name: "src",
      fileCount: 1,
    })
  );
  model.dependencies.push(
    createDependencyModel({
      name: "typescript",
      version: "^5.0.0",
      kind: "development",
    })
  );
  model.brainDocuments.push(
    createBrainDocumentModel({
      path: "C:/Projects/TestApp/.brain/index.md",
      relativePath: ".brain/index.md",
      title: "Index",
      role: "router",
    })
  );
  model.diagnostics.push(
    createDiagnosticModel({
      level: "info",
      code: "INFO_OK",
      message: "Ready",
    })
  );

  const json = serializeProjectModel(model, true);
  const parsed = deserializeProjectModel(json);

  assert.equal(parsed.name, "TestApp");
  assert.equal(parsed.rootPath, "C:/Projects/TestApp");
  assert.equal(parsed.files.length, 1);
  assert.equal(parsed.files[0].name, "index.ts");
  assert.equal(parsed.directories.length, 1);
  assert.equal(parsed.dependencies.length, 1);
  assert.equal(parsed.brainDocuments.length, 1);
  assert.equal(parsed.diagnostics.length, 1);
});

test("deserializeProjectModel rejects invalid JSON or malformed structures", () => {
  assert.throws(() => deserializeProjectModel("invalid-json"), /Invalid project model JSON/);
  assert.throws(() => deserializeProjectModel("null"), /root must be an object/);
  assert.throws(() => deserializeProjectModel(JSON.stringify({ rootPath: "/app" })), /missing or invalid 'name'/);
  assert.throws(() => deserializeProjectModel(JSON.stringify({ name: "app" })), /missing or invalid 'rootPath'/);
});
