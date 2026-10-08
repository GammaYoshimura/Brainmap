import fs from "node:fs";
import path from "node:path";
import { FileModel } from "../core/model.js";
import { PersistedScanState } from "./scanner.js";

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
