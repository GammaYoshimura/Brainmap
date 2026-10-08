import path from "node:path";
import { FileModel } from "../core/model.js";

export interface FileMapEntry {
  relativePath: string;
  name: string;
  directory: string;
  extension: string;
  size: number;
  language?: string;
  isEntrypoint?: boolean;
}

export interface FileMapGroup {
  directory: string;
  files: FileMapEntry[];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildFileMap(files: FileModel[]): FileMapGroup[] {
  const sorted = [...files].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  const groupsMap = new Map<string, FileMapEntry[]>();

  for (const file of sorted) {
    const dir = path.dirname(file.relativePath).replace(/\\/g, "/");
    const normalizedDir = dir === "." ? "." : dir;

    if (!groupsMap.has(normalizedDir)) {
      groupsMap.set(normalizedDir, []);
    }

    groupsMap.get(normalizedDir)!.push({
      relativePath: file.relativePath,
      name: file.name,
      directory: normalizedDir,
      extension: file.extension,
      size: file.size,
      language: file.language,
      isEntrypoint: file.isEntrypoint,
    });
  }

  const result: FileMapGroup[] = [];
  for (const [directory, groupFiles] of groupsMap.entries()) {
    result.push({
      directory,
      files: groupFiles,
    });
  }

  return result.sort((a, b) => a.directory.localeCompare(b.directory));
}

export function formatFileMap(groups: FileMapGroup[]): string {
  if (groups.length === 0) {
    return "### File Map\n\nNo files discovered.\n";
  }

  const lines: string[] = ["### File Map", ""];

  for (const group of groups) {
    const dirDisplay = group.directory === "." ? "Root (`.`)" : `\`${group.directory}/\``;
    const countLabel = `${group.files.length} file${group.files.length === 1 ? "" : "s"}`;
    lines.push(`#### ${dirDisplay} (${countLabel})`, "");

    for (const file of group.files) {
      const details: string[] = [];
      if (file.language) details.push(file.language);
      details.push(formatFileSize(file.size));
      if (file.isEntrypoint) details.push("entry-point");

      lines.push(`- \`${file.name}\` (${details.join(", ")})`);
    }

    lines.push("");
  }

  return lines.join("\n");
}
