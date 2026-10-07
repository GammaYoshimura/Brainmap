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
