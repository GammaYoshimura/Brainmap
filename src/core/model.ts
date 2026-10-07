/**
 * Internal project representation and domain models for Brainmap.
 */

export * from "./paths.js";
export * from "./serialization.js";

export interface FileModel {
  path: string;
  relativePath: string;
  name: string;
  extension: string;
  size: number;
  language?: string;
  isEntrypoint?: boolean;
}

export interface DirectoryModel {
  path: string;
  relativePath: string;
  name: string;
  fileCount: number;
  subdirectories: string[];
}

export interface DependencyModel {
  name: string;
  version: string;
  kind: "production" | "development" | "peer" | "optional";
  manifestPath?: string;
}

export interface BrainDocumentModel {
  path: string;
  relativePath: string;
  title: string;
  role: "router" | "constitution" | "state" | "handoff" | "decision" | "subsystem" | "specialized";
  outgoingLinks: string[];
}

export interface DiagnosticModel {
  level: "info" | "warning" | "error";
  code: string;
  message: string;
  targetPath?: string;
  rule?: string;
}

export interface ProjectModel {
  name: string;
  rootPath: string;
  createdAt: string;
  version: string;
  files: FileModel[];
  directories: DirectoryModel[];
  dependencies: DependencyModel[];
  brainDocuments: BrainDocumentModel[];
  diagnostics: DiagnosticModel[];
}

export function createDiagnosticModel(data: {
  level?: "info" | "warning" | "error";
  code: string;
  message: string;
  targetPath?: string;
  rule?: string;
}): DiagnosticModel {
  return {
    level: "warning",
    ...data,
  };
}

export function createBrainDocumentModel(data: {
  path: string;
  relativePath: string;
  title: string;
  role: "router" | "constitution" | "state" | "handoff" | "decision" | "subsystem" | "specialized";
  outgoingLinks?: string[];
}): BrainDocumentModel {
  return {
    outgoingLinks: [],
    ...data,
  };
}

export function createDependencyModel(data: {
  name: string;
  version: string;
  kind?: "production" | "development" | "peer" | "optional";
  manifestPath?: string;
}): DependencyModel {
  return {
    kind: "production",
    ...data,
  };
}

export function createDirectoryModel(data: {
  path: string;
  relativePath: string;
  name: string;
  fileCount?: number;
  subdirectories?: string[];
}): DirectoryModel {
  return {
    fileCount: 0,
    subdirectories: [],
    ...data,
  };
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
