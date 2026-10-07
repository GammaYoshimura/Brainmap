/**
 * Internal project representation and domain models for Brainmap.
 */

export interface ProjectModel {
  name: string;
  rootPath: string;
  createdAt: string;
  version: string;
  files: unknown[];
  directories: unknown[];
  dependencies: unknown[];
  brainDocuments: unknown[];
  diagnostics: unknown[];
}

export function createProjectModel(name: string, rootPath: string): ProjectModel {
  return {
    name,
    rootPath,
    createdAt: new Date().toISOString(),
    version: "1.0.0",
    files: [],
    directories: [],
    dependencies: [],
    brainDocuments: [],
    diagnostics: [],
  };
}
