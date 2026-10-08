import fs from "node:fs";
import path from "node:path";
import { normalizePath, toRelativePath } from "../core/paths.js";
import { FileModel, createFileModel } from "../core/model.js";
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
