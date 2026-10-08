import fs from "node:fs";
import path from "node:path";
import { FileModel, DirectoryModel, DependencyModel, ProjectModel, createDependencyModel } from "../core/model.js";
import { toRelativePath } from "../core/paths.js";
import { PersistedScanState, ProjectScanSummary } from "./scanner.js";
import { recordDeclaredDependencies } from "../detector/manifests.js";

export function getPersistedScanPath(projectRoot: string): string {
  return path.join(projectRoot, ".brain", "scan.json");
}

export function loadPersistedScanState(projectRoot: string): PersistedScanState | null {
  const scanPath = getPersistedScanPath(projectRoot);
  if (!fs.existsSync(scanPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(scanPath, "utf8");
    return JSON.parse(raw) as PersistedScanState;
  } catch {
    return null;
  }
}

export function detectAddedFiles(
  currentFiles: FileModel[],
  persistedFiles: FileModel[]
): FileModel[] {
  const persistedPaths = new Set(persistedFiles.map((f) => f.relativePath));
  return currentFiles.filter((f) => !persistedPaths.has(f.relativePath));
}

export function detectModifiedFiles(
  currentFiles: FileModel[],
  persistedFiles: FileModel[]
): FileModel[] {
  const persistedMap = new Map(persistedFiles.map((f) => [f.relativePath, f]));
  const modified: FileModel[] = [];

  for (const current of currentFiles) {
    const previous = persistedMap.get(current.relativePath);
    if (previous && current.size !== previous.size) {
      modified.push(current);
    }
  }

  return modified;
}

export function detectRemovedFiles(
  currentFiles: FileModel[],
  persistedFiles: FileModel[]
): FileModel[] {
  const currentPaths = new Set(currentFiles.map((f) => f.relativePath));
  return persistedFiles.filter((f) => !currentPaths.has(f.relativePath));
}

export interface FileMetadataDelta {
  relativePath: string;
  previous: Partial<FileModel>;
  current: Partial<FileModel>;
  changes: ("size" | "extension" | "language" | "isEntrypoint")[];
}

export function detectMetadataChanges(
  currentFiles: FileModel[],
  persistedFiles: FileModel[]
): FileMetadataDelta[] {
  const persistedMap = new Map(persistedFiles.map((f) => [f.relativePath, f]));
  const deltas: FileMetadataDelta[] = [];

  for (const current of currentFiles) {
    const previous = persistedMap.get(current.relativePath);
    if (!previous) {
      continue;
    }

    const changes: ("size" | "extension" | "language" | "isEntrypoint")[] = [];

    if (current.size !== previous.size) {
      changes.push("size");
    }
    if (current.extension !== previous.extension) {
      changes.push("extension");
    }
    if (current.language !== previous.language) {
      changes.push("language");
    }
    if (Boolean(current.isEntrypoint) !== Boolean(previous.isEntrypoint)) {
      changes.push("isEntrypoint");
    }

    if (changes.length > 0) {
      deltas.push({
        relativePath: current.relativePath,
        previous: {
          size: previous.size,
          extension: previous.extension,
          language: previous.language,
          isEntrypoint: previous.isEntrypoint,
        },
        current: {
          size: current.size,
          extension: current.extension,
          language: current.language,
          isEntrypoint: current.isEntrypoint,
        },
        changes,
      });
    }
  }

  return deltas;
}

export function extractFileDependencies(
  filePath: string,
  rootPath: string
): DependencyModel[] {
  return recordDeclaredDependencies(filePath, rootPath);
}

export function recomputeDependenciesForChangedFiles(
  changedFiles: FileModel[],
  rootPath: string
): DependencyModel[] {
  const allDeps: DependencyModel[] = [];
  for (const file of changedFiles) {
    const deps = extractFileDependencies(file.path, rootPath);
    allDeps.push(...deps);
  }
  return allDeps;
}

export function updateProjectModelIncrementally(
  previousModel: ProjectModel,
  changes: {
    addedFiles: FileModel[];
    modifiedFiles: FileModel[];
    removedFiles: FileModel[];
    directories?: DirectoryModel[];
    recomputedDependencies?: DependencyModel[];
  }
): ProjectModel {
  const removedPaths = new Set(changes.removedFiles.map((f) => f.relativePath));
  const modifiedMap = new Map(changes.modifiedFiles.map((f) => [f.relativePath, f]));

  const updatedFiles: FileModel[] = previousModel.files
    .filter((f) => !removedPaths.has(f.relativePath))
    .map((f) => modifiedMap.get(f.relativePath) ?? f);

  updatedFiles.push(...changes.addedFiles);
  updatedFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  let dependencies = [...previousModel.dependencies];
  if (changes.recomputedDependencies && changes.recomputedDependencies.length > 0) {
    const newManifestPaths = new Set(
      changes.recomputedDependencies.map((d) => d.manifestPath).filter(Boolean)
    );
    dependencies = dependencies.filter((d) => !newManifestPaths.has(d.manifestPath));
    dependencies.push(...changes.recomputedDependencies);
  }

  const directories = changes.directories ?? previousModel.directories;

  return {
    ...previousModel,
    files: updatedFiles,
    directories,
    dependencies,
  };
}

export function persistUpdatedState(
  projectRoot: string,
  model: ProjectModel,
  summary: ProjectScanSummary
): string {
  const brainDir = path.join(projectRoot, ".brain");
  if (!fs.existsSync(brainDir)) {
    fs.mkdirSync(brainDir, { recursive: true });
  }

  const outputPath = getPersistedScanPath(projectRoot);
  const payload: PersistedScanState = {
    summary,
    scannedAt: new Date().toISOString(),
    files: model.files,
    model,
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf8");
  return outputPath;
}

export interface ProjectDiff {
  added: FileModel[];
  modified: FileModel[];
  removed: FileModel[];
  metadataChanges: FileMetadataDelta[];
  hasChanges: boolean;
}

export function computeProjectDiff(
  currentFiles: FileModel[],
  persistedFiles: FileModel[]
): ProjectDiff {
  const added = detectAddedFiles(currentFiles, persistedFiles);
  const modified = detectModifiedFiles(currentFiles, persistedFiles);
  const removed = detectRemovedFiles(currentFiles, persistedFiles);
  const metadataChanges = detectMetadataChanges(currentFiles, persistedFiles);

  const hasChanges =
    added.length > 0 ||
    modified.length > 0 ||
    removed.length > 0 ||
    metadataChanges.length > 0;

  return {
    added,
    modified,
    removed,
    metadataChanges,
    hasChanges,
  };
}

export function formatUpdateSummary(diff: ProjectDiff): string {
  const lines: string[] = ["Project Update Summary:"];

  lines.push(`  Added: ${diff.added.length} file(s)`);
  for (const file of diff.added) {
    lines.push(`    + ${file.relativePath}`);
  }

  lines.push(`  Modified: ${diff.modified.length} file(s)`);
  for (const file of diff.modified) {
    lines.push(`    ~ ${file.relativePath}`);
  }

  lines.push(`  Removed: ${diff.removed.length} file(s)`);
  for (const file of diff.removed) {
    lines.push(`    - ${file.relativePath}`);
  }

  return lines.join("\n");
}
