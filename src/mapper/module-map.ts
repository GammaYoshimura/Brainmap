import path from "node:path";
import { FileModel, DirectoryModel } from "../core/model.js";

export interface ModuleMapEntry {
  name: string;
  relativePath: string;
  fileCount: number;
  languages: string[];
  hasEntrypoint: boolean;
  sampleFiles: string[];
}

export function detectModules(files: FileModel[], directories: DirectoryModel[] = []): ModuleMapEntry[] {
  const candidateDirPaths = new Set<string>();

  // 1. Check parent container directories (src, packages, apps, modules, services, libs)
  const containerPrefixes = ["src/", "packages/", "apps/", "modules/", "services/", "libs/"];
  
  for (const dir of directories) {
    const rel = dir.relativePath.replace(/^\.\/?/, "");
    for (const prefix of containerPrefixes) {
      if (rel.startsWith(prefix) && rel.length > prefix.length) {
        const sub = rel.slice(prefix.length).split("/")[0];
        candidateDirPaths.add(`${prefix}${sub}`);
      }
    }
    // Also include top-level directories like tests, lib, scripts
    if (!rel.includes("/") && rel !== "" && rel !== "." && !containerPrefixes.some(p => p.startsWith(`${rel}/`))) {
      candidateDirPaths.add(rel);
    }
  }

  // Also check if src has files directly in it
  const hasSrcRootFiles = files.some((f) => {
    const rel = f.relativePath.replace(/^\.\/?/, "");
    return rel.startsWith("src/") && !rel.slice(4).includes("/");
  });
  if (hasSrcRootFiles) {
    candidateDirPaths.add("src");
  }

  // Fallback: If no candidate dirs found from directories list, infer from file paths
  if (candidateDirPaths.size === 0) {
    for (const file of files) {
      const rel = file.relativePath.replace(/^\.\/?/, "");
      if (rel.includes("/")) {
        const top = rel.split("/")[0];
        if (top === "src") {
          const parts = rel.split("/");
          if (parts.length > 2) {
            candidateDirPaths.add(`src/${parts[1]}`);
          } else {
            candidateDirPaths.add("src");
          }
        } else {
          candidateDirPaths.add(top);
        }
      }
    }
  }

  // If still nothing (e.g. flat root files)
  if (candidateDirPaths.size === 0 && files.length > 0) {
    candidateDirPaths.add(".");
  }

  const moduleEntries: ModuleMapEntry[] = [];

  for (const candidatePath of Array.from(candidateDirPaths).sort()) {
    const moduleFiles = files.filter((f) => {
      const rel = f.relativePath.replace(/^\.\/?/, "");
      if (candidatePath === ".") {
        return !rel.includes("/");
      }
      if (candidatePath === "src") {
        return rel.startsWith("src/") && !rel.slice(4).includes("/");
      }
      return rel === candidatePath || rel.startsWith(`${candidatePath}/`);
    });

    if (moduleFiles.length === 0) {
      continue;
    }

    const languages = Array.from(
      new Set(
        moduleFiles
          .map((f) => f.language)
          .filter((lang): lang is string => Boolean(lang))
      )
    ).sort();

    const hasEntrypoint = moduleFiles.some((f) => Boolean(f.isEntrypoint));
    const sampleFiles = moduleFiles.slice(0, 3).map((f) => f.name);
    const name = candidatePath === "." ? "root" : path.basename(candidatePath);

    moduleEntries.push({
      name,
      relativePath: candidatePath,
      fileCount: moduleFiles.length,
      languages,
      hasEntrypoint,
      sampleFiles,
    });
  }

  return moduleEntries;
}

export function formatModuleMap(modules: ModuleMapEntry[]): string {
  if (modules.length === 0) {
    return "### Module Map\n\nNo modules detected.\n";
  }

  const lines: string[] = ["### Module Map", ""];

  for (const mod of modules) {
    const pathDisplay = mod.relativePath === "." ? "`./`" : `\`${mod.relativePath}/\``;
    const langDisplay = mod.languages.length > 0 ? mod.languages.join(", ") : "Unspecified";
    const countLabel = `${mod.fileCount} file${mod.fileCount === 1 ? "" : "s"}`;
    const epBadge = mod.hasEntrypoint ? " [entry-point]" : "";

    lines.push(`- **\`${mod.name}\`** (${pathDisplay}) — ${countLabel} (${langDisplay})${epBadge}`);
  }

  return lines.join("\n") + "\n";
}
