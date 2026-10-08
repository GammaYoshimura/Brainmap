import fs from "node:fs";
import path from "node:path";
import { normalizePath, toRelativePath } from "../core/paths.js";
import { FileModel, DirectoryModel, ProjectModel, createFileModel, createDirectoryModel } from "../core/model.js";
import { detectLanguageByExtension, detectProjectLanguages, LanguageSummary } from "./languages.js";
import { isEntryPoint } from "../detector/entrypoints.js";
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
  const language = detectLanguageByExtension(extension);

  return createFileModel({
    path: normPath,
    relativePath: relPath,
    name,
    extension,
    size: stat.size,
    language,
    isEntrypoint: isEntryPoint(relPath),
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

export interface ProjectScanSummary {
  rootPath: string;
  totalFiles: number;
  totalDirectories: number;
  totalBytes: number;
  extensions: Record<string, number>;
  languages: LanguageSummary[];
}

export function generateProjectSummary(
  rootPath: string,
  files: FileModel[],
  directories: DirectoryModel[]
): ProjectScanSummary {
  const totalFiles = files.length;
  const totalDirectories = directories.length;
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const extensions = countFilesByExtension(files);
  const languages = detectProjectLanguages(files);

  return {
    rootPath: normalizePath(rootPath),
    totalFiles,
    totalDirectories,
    totalBytes,
    extensions,
    languages,
  };
}

export function formatProjectSummary(summary: ProjectScanSummary): string {
  const lines: string[] = [
    `Project: ${summary.rootPath}`,
    `Files: ${summary.totalFiles}`,
    `Directories: ${summary.totalDirectories}`,
    `Total Size: ${summary.totalBytes} bytes`,
  ];

  if (summary.languages.length > 0) {
    lines.push("Languages:");
    for (const lang of summary.languages) {
      lines.push(`  - ${lang.name}: ${lang.fileCount} files (${lang.percentage}%)`);
    }
  }

  return lines.join("\n");
}

export interface PersistedScanState {
  summary: ProjectScanSummary;
  scannedAt: string;
  files?: FileModel[];
  model?: ProjectModel;
}

export function persistScanResults(
  targetDirOrBrainDir: string,
  summary: ProjectScanSummary,
  model?: ProjectModel,
  files?: FileModel[]
): string {
  const isBrainDir = path.basename(targetDirOrBrainDir) === ".brain";
  const brainDir = isBrainDir ? targetDirOrBrainDir : path.join(targetDirOrBrainDir, ".brain");

  if (!fs.existsSync(brainDir)) {
    fs.mkdirSync(brainDir, { recursive: true });
  }

  const outputPath = path.join(brainDir, "scan.json");
  const payload: PersistedScanState = {
    summary,
    scannedAt: new Date().toISOString(),
    files: files ?? model?.files ?? [],
    ...(model ? { model } : {}),
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf8");
  return outputPath;
}
