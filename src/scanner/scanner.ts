import fs from "node:fs";
import path from "node:path";
import { normalizePath, toRelativePath } from "../core/paths.js";
import { FileModel, DirectoryModel, createFileModel, createDirectoryModel } from "../core/model.js";
import {
  ExclusionConfig,
  createDefaultExclusionConfig,
  loadGitignorePatterns,
  shouldExclude,
} from "./exclusions.js";

export interface TraversalResult {
  rootPath: string;
  files: string[];
  directories: string[];
}

export function recordDiscoveredFile(fullPath: string, rootPath: string): FileModel {
  const normPath = normalizePath(fullPath);
  const relPath = toRelativePath(rootPath, fullPath);
  const name = path.basename(fullPath);
  const extension = path.extname(fullPath).toLowerCase();
  const stat = fs.statSync(fullPath);

  return createFileModel({
    path: normPath,
    relativePath: relPath,
    name,
    extension,
    size: stat.size,
  });
}

export function recordDiscoveredFiles(filePaths: string[], rootPath: string): FileModel[] {
  return filePaths.map((filePath) => recordDiscoveredFile(filePath, rootPath));
}

export function recordDiscoveredDirectory(
  dirPath: string,
  rootPath: string,
  allFiles: string[] = [],
  allDirs: string[] = []
): DirectoryModel {
  const normPath = normalizePath(dirPath);
  const relPath = toRelativePath(rootPath, dirPath);
  const name = path.basename(dirPath) || path.basename(rootPath);

  const fileCount = allFiles.filter((f) => {
    const parent = path.dirname(f);
    return normalizePath(parent) === normPath;
  }).length;

  const subdirectories = allDirs
    .filter((d) => {
      const parent = path.dirname(d);
      return normalizePath(parent) === normPath;
    })
    .map((d) => toRelativePath(rootPath, d));

  return createDirectoryModel({
    path: normPath,
    relativePath: relPath,
    name,
    fileCount,
    subdirectories,
  });
}

export function recordDiscoveredDirectories(
  dirPaths: string[],
  rootPath: string,
  allFiles: string[] = []
): DirectoryModel[] {
  return dirPaths.map((dir) => recordDiscoveredDirectory(dir, rootPath, allFiles, dirPaths));
}

export function traverseProject(
  projectRoot: string,
  config: ExclusionConfig = createDefaultExclusionConfig()
): TraversalResult {
  const root = path.resolve(projectRoot);
  const gitignorePatterns = config.useGitignore ? loadGitignorePatterns(root) : [];

  const files: string[] = [];
  const directories: string[] = [];

  function walk(currentDir: string): void {
    if (!fs.existsSync(currentDir)) {
      return;
    }

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    // Deterministic traversal order
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = toRelativePath(root, fullPath);

      if (entry.isDirectory()) {
        if (shouldExclude(relPath, config, gitignorePatterns, true)) {
          continue;
        }
        directories.push(normalizePath(fullPath));
        walk(fullPath);
      } else if (entry.isFile()) {
        if (shouldExclude(relPath, config, gitignorePatterns, false)) {
          continue;
        }
        files.push(normalizePath(fullPath));
      }
    }
  }

  walk(root);

  return {
    rootPath: normalizePath(root),
    files,
    directories,
  };
}

export function extractFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export function collectFileExtensions(files: (FileModel | string)[]): string[] {
  const extensions = new Set<string>();
  for (const item of files) {
    const ext = typeof item === "string" ? extractFileExtension(item) : item.extension;
    extensions.add(ext);
  }
  return Array.from(extensions).sort();
}

export function countFilesByExtension(files: (FileModel | string)[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of files) {
    const ext = typeof item === "string" ? extractFileExtension(item) : item.extension;
    counts[ext] = (counts[ext] ?? 0) + 1;
  }
  return counts;
}
