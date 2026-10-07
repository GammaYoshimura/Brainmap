/**
 * Internal project representation and domain models for Brainmap.
 */

export interface FileModel {
  path: string;
  relativePath: string;
  name: string;
  extension: string;
  size: number;
  language?: string;
  isEntrypoint?: boolean;
}

export interface ProjectModel {
  name: string;
  rootPath: string;
  createdAt: string;
  version: string;
  files: FileModel[];
  directories: unknown[];
  dependencies: unknown[];
  brainDocuments: unknown[];
  diagnostics: unknown[];
}

export function createFileModel(data: {
  path: string;
  relativePath: string;
  name: string;
  extension: string;
  size: number;
  language?: string;
  isEntrypoint?: boolean;
}): FileModel {
  return { ...data };
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
