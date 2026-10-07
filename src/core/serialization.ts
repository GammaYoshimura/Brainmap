import type { ProjectModel } from "./model.js";

/**
 * Serializes a ProjectModel into deterministic JSON string.
 */
export function serializeProjectModel(model: ProjectModel, pretty = true): string {
  if (pretty) {
    return JSON.stringify(model, null, 2);
  }
  return JSON.stringify(model);
}

/**
 * Deserializes a JSON string into a ProjectModel, validating core attributes.
 */
export function deserializeProjectModel(json: string): ProjectModel {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(`Invalid project model JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Invalid project model: root must be an object");
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.name !== "string" || !obj.name) {
    throw new Error("Invalid project model: missing or invalid 'name'");
  }

  if (typeof obj.rootPath !== "string") {
    throw new Error("Invalid project model: missing or invalid 'rootPath'");
  }

  return {
    name: obj.name,
    rootPath: obj.rootPath,
    createdAt: typeof obj.createdAt === "string" ? obj.createdAt : new Date().toISOString(),
    version: typeof obj.version === "string" ? obj.version : "1.0.0",
    files: Array.isArray(obj.files) ? (obj.files as any[]) : [],
    directories: Array.isArray(obj.directories) ? (obj.directories as any[]) : [],
    dependencies: Array.isArray(obj.dependencies) ? (obj.dependencies as any[]) : [],
    brainDocuments: Array.isArray(obj.brainDocuments) ? (obj.brainDocuments as any[]) : [],
    diagnostics: Array.isArray(obj.diagnostics) ? (obj.diagnostics as any[]) : [],
  };
}
