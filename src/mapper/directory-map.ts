import { DirectoryModel } from "../core/model.js";

export interface DirectoryMapEntry {
  path: string;
  relativePath: string;
  name: string;
  fileCount: number;
  subdirectories: string[];
  depth: number;
}

export function buildDirectoryMap(directories: DirectoryModel[]): DirectoryMapEntry[] {
  const sorted = [...directories].sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return sorted.map((dir) => {
    const cleanPath = dir.relativePath.replace(/^\.\/?/, "");
    const depth = cleanPath === "" ? 0 : cleanPath.split("/").length;

    return {
      path: dir.path,
      relativePath: dir.relativePath,
      name: dir.name,
      fileCount: dir.fileCount,
      subdirectories: [...dir.subdirectories].sort(),
      depth,
    };
  });
}

export function formatDirectoryMap(entries: DirectoryMapEntry[]): string {
  if (entries.length === 0) {
    return "### Directory Map\n\nNo directories discovered.\n";
  }

  const lines: string[] = ["### Directory Map", ""];

  for (const entry of entries) {
    const displayPath = entry.relativePath === "" || entry.relativePath === "." ? "./" : `${entry.relativePath}/`;
    const indent = "  ".repeat(entry.depth);
    const fileLabel = `${entry.fileCount} file${entry.fileCount === 1 ? "" : "s"}`;
    const subCount = entry.subdirectories.length;
    const subLabel = subCount > 0 ? `, ${subCount} subdirector${subCount === 1 ? "y" : "ies"}` : "";
    lines.push(`${indent}- \`${displayPath}\` (${fileLabel}${subLabel})`);
  }

  return lines.join("\n") + "\n";
}
