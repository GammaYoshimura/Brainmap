import fs from "node:fs";
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

export const NPM_MANIFEST_RULE: ManifestRule = {
  kind: "npm",
  ecosystem: "Node.js",
  matches: (fileName) => fileName === "package.json",
};

export const PUBSPEC_MANIFEST_RULE: ManifestRule = {
  kind: "pubspec",
  ecosystem: "Dart/Flutter",
  matches: (fileName) => fileName === "pubspec.yaml" || fileName === "pubspec.yml",
};

/**
 * Checks whether a given path is a pubspec.yaml manifest.
 */
export function isPubspecYaml(filePath: string): boolean {
  const base = path.basename(filePath);
  return base === "pubspec.yaml" || base === "pubspec.yml";
}

export interface PubspecManifest {
  name?: string;
  version?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Deterministically parses a pubspec.yaml manifest content or file path.
 */
export function parsePubspecYaml(contentOrPath: string): PubspecManifest | null {
  try {
    let raw = contentOrPath;
    if (fs.existsSync(contentOrPath)) {
      raw = fs.readFileSync(contentOrPath, "utf8");
    }

    const lines = raw.split(/\r?\n/);
    const result: PubspecManifest = {
      dependencies: {},
      devDependencies: {},
    };

    let section: "none" | "dependencies" | "dev_dependencies" = "none";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      if (/^name:\s*(.*)/.test(line)) {
        result.name = line.replace(/^name:\s*/, "").trim().replace(/['"]/g, "");
        section = "none";
      } else if (/^version:\s*(.*)/.test(line)) {
        result.version = line.replace(/^version:\s*/, "").trim().replace(/['"]/g, "");
        section = "none";
      } else if (/^description:\s*(.*)/.test(line)) {
        result.description = line.replace(/^description:\s*/, "").trim().replace(/['"]/g, "");
        section = "none";
      } else if (/^dependencies:\s*$/.test(line)) {
        section = "dependencies";
      } else if (/^dev_dependencies:\s*$/.test(line)) {
        section = "dev_dependencies";
      } else if (/^[a-zA-Z0-9_-]+:/.test(line) && !line.startsWith(" ") && !line.startsWith("\t")) {
        section = "none";
      } else if (section !== "none" && /^\s{2}[a-zA-Z0-9_-]+:/.test(line)) {
        const match = line.match(/^\s{2}([a-zA-Z0-9_-]+):\s*(.*)$/);
        if (match) {
          const depName = match[1];
          const depVal = match[2].trim().replace(/['"]/g, "");
          const target = section === "dependencies" ? result.dependencies! : result.devDependencies!;
          target[depName] = depVal || "*";
        }
      }
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Checks whether a given path is a package.json manifest.
 */
export function isPackageJson(filePath: string): boolean {
  return path.basename(filePath) === "package.json";
}

export interface NpmPackageManifest {
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

/**
 * Parses a package.json file content or path.
 */
export function parsePackageJson(contentOrPath: string): NpmPackageManifest | null {
  try {
    let raw = contentOrPath;
    if (fs.existsSync(contentOrPath)) {
      raw = fs.readFileSync(contentOrPath, "utf8");
    }
    return JSON.parse(raw) as NpmPackageManifest;
  } catch {
    return null;
  }
}

/**
 * Manifest detection rules registry.
 */
export const MANIFEST_RULES: ManifestRule[] = [
  NPM_MANIFEST_RULE,
  PUBSPEC_MANIFEST_RULE,
];

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
