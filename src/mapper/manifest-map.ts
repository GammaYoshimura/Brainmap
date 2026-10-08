import fs from "node:fs";
import path from "node:path";
import { FileModel } from "../core/model.js";
import {
  detectManifests,
  parsePackageJson,
  parsePubspecYaml,
  parseComposerJson,
  parsePyprojectToml,
  parseDotnetProject,
  parseCargoToml,
  recordDeclaredDependencies,
  ManifestKind,
} from "../detector/manifests.js";

export interface ManifestMapEntry {
  relativePath: string;
  fileName: string;
  ecosystem: string;
  kind: ManifestKind;
  packageName?: string;
  version?: string;
  dependencyCount: number;
}

export function buildManifestMap(files: FileModel[], rootPath?: string): ManifestMapEntry[] {
  const descriptors = detectManifests(files);
  const entries: ManifestMapEntry[] = [];

  for (const desc of descriptors) {
    let fullPath = desc.path;
    if (rootPath) {
      fullPath = path.isAbsolute(desc.path) ? desc.path : path.join(rootPath, desc.relativePath);
    }

    let packageName: string | undefined;
    let version: string | undefined;
    let dependencyCount = 0;

    if (fs.existsSync(fullPath)) {
      const deps = recordDeclaredDependencies(fullPath, rootPath || path.dirname(fullPath));
      dependencyCount = deps.length;

      try {
        const content = fs.readFileSync(fullPath, "utf8");
        switch (desc.kind) {
          case "npm": {
            const parsed = parsePackageJson(content);
            if (parsed) {
              packageName = parsed.name;
              version = parsed.version;
            }
            break;
          }
          case "pubspec": {
            const parsed = parsePubspecYaml(content);
            if (parsed) {
              packageName = parsed.name;
              version = parsed.version;
            }
            break;
          }
          case "composer": {
            const parsed = parseComposerJson(content);
            if (parsed) {
              packageName = parsed.name;
              version = parsed.version;
            }
            break;
          }
          case "cargo": {
            const parsed = parseCargoToml(content);
            if (parsed) {
              packageName = parsed.name;
              version = parsed.version;
            }
            break;
          }
          case "python": {
            const parsed = parsePyprojectToml(content);
            if (parsed) {
              packageName = parsed.name;
              version = parsed.version;
            }
            break;
          }
          case "dotnet": {
            const parsed = parseDotnetProject(content);
            if (parsed) {
              packageName = parsed.targetFramework;
            }
            break;
          }
        }
      } catch {
        // Fall back gracefully
      }
    }

    entries.push({
      relativePath: desc.relativePath,
      fileName: desc.fileName,
      ecosystem: desc.ecosystem,
      kind: desc.kind,
      packageName,
      version,
      dependencyCount,
    });
  }

  return entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function formatManifestMap(manifests: ManifestMapEntry[]): string {
  if (manifests.length === 0) {
    return "### Manifests\n\nNo manifests detected.\n";
  }

  const lines: string[] = ["### Manifests", ""];

  for (const manifest of manifests) {
    const details: string[] = [];
    if (manifest.packageName) {
      const ver = manifest.version ? ` (v${manifest.version})` : "";
      details.push(`\`${manifest.packageName}\`${ver}`);
    }
    const depLabel = `${manifest.dependencyCount} declared dependenc${manifest.dependencyCount === 1 ? "y" : "ies"}`;
    details.push(depLabel);

    const detailsStr = details.length > 0 ? ` — ${details.join(", ")}` : "";
    lines.push(`- **\`${manifest.relativePath}\`** (${manifest.ecosystem})${detailsStr}`);
  }

  return lines.join("\n") + "\n";
}
