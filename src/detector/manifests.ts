import path from "node:path";
import { normalizePath } from "../core/paths.js";
import { FileModel } from "../core/model.js";

export type ManifestKind =
  | "npm"
  | "pubspec"
  | "composer"
  | "python"
  | "dotnet"
  | "cargo"
  | "generic";

export interface ManifestDescriptor {
  path: string;
  relativePath: string;
  fileName: string;
  kind: ManifestKind;
  ecosystem: string;
}

export interface ManifestRule {
  kind: ManifestKind;
  ecosystem: string;
  matches: (fileName: string, relativePath: string) => boolean;
}

/**
 * Manifest detection rules registry.
 */
export const MANIFEST_RULES: ManifestRule[] = [];

/**
 * Register a manifest rule into the registry.
 */
export function registerManifestRule(rule: ManifestRule): void {
  MANIFEST_RULES.push(rule);
}

/**
 * Identifies whether a given path corresponds to a supported project manifest.
 */
export function isManifest(filePath: string): boolean {
  const normalized = normalizePath(filePath).replace(/^\.\//, "");
  const fileName = path.basename(normalized);
  return MANIFEST_RULES.some((rule) => rule.matches(fileName, normalized));
}

/**
 * Inspects a file path and returns its ManifestDescriptor, or null if not a recognized manifest.
 */
export function identifyManifest(filePath: string): ManifestDescriptor | null {
  const normalized = normalizePath(filePath).replace(/^\.\//, "");
  const fileName = path.basename(normalized);

  for (const rule of MANIFEST_RULES) {
    if (rule.matches(fileName, normalized)) {
      return {
        path: normalized,
        relativePath: normalized,
        fileName,
        kind: rule.kind,
        ecosystem: rule.ecosystem,
      };
    }
  }

  return null;
}

/**
 * Discovers and identifies all manifests within a list of project files.
 */
export function detectManifests(files: (FileModel | string)[]): ManifestDescriptor[] {
  const manifests: ManifestDescriptor[] = [];

  for (const file of files) {
    const relPath = typeof file === "string" ? file : file.relativePath;
    const descriptor = identifyManifest(relPath);
    if (descriptor) {
      manifests.push(descriptor);
    }
  }

  return manifests;
}
