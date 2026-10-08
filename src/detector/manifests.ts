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

export const COMPOSER_MANIFEST_RULE: ManifestRule = {
  kind: "composer",
  ecosystem: "PHP",
  matches: (fileName) => fileName === "composer.json",
};

export const PYTHON_MANIFEST_RULE: ManifestRule = {
  kind: "python",
  ecosystem: "Python",
  matches: (fileName) =>
    fileName === "pyproject.toml" ||
    /^requirements(-\w+)?\.txt$/i.test(fileName) ||
    fileName === "setup.py" ||
    fileName === "setup.cfg" ||
    fileName === "Pipfile",
};

export const DOTNET_MANIFEST_RULE: ManifestRule = {
  kind: "dotnet",
  ecosystem: ".NET",
  matches: (fileName) =>
    /\.(csproj|fsproj|vbproj)$/i.test(fileName) ||
    fileName === "Directory.Build.props" ||
    fileName === "packages.config",
};

/**
 * Checks whether a given path is a .NET project manifest.
 */
export function isDotnetManifest(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return (
    /\.(csproj|fsproj|vbproj)$/i.test(fileName) ||
    fileName === "Directory.Build.props" ||
    fileName === "packages.config"
  );
}

export interface DotnetManifest {
  projectName?: string;
  targetFramework?: string;
  packageReferences?: Record<string, string>;
}

/**
 * Deterministically parses a .NET project file.
 */
export function parseDotnetProject(contentOrPath: string): DotnetManifest | null {
  try {
    let raw = contentOrPath;
    let fileName = "";
    if (fs.existsSync(contentOrPath)) {
      raw = fs.readFileSync(contentOrPath, "utf8");
      fileName = path.basename(contentOrPath);
    }

    const packageReferences: Record<string, string> = {};

    const tfMatch = raw.match(/<TargetFramework>(.*?)<\/TargetFramework>/i);
    const targetFramework = tfMatch ? tfMatch[1].trim() : undefined;

    const packageRefRegex = /<PackageReference\s+[^>]*Include=["']([^"']+)["'][^>]*?(?:\/>|>([\s\S]*?)<\/PackageReference>)/gi;
    let match: RegExpExecArray | null;

    while ((match = packageRefRegex.exec(raw)) !== null) {
      const pkgName = match[1];
      const fullTag = match[0];
      const innerContent = match[2] || "";

      let version = "*";
      const verAttrMatch = fullTag.match(/Version=["']([^"']+)["']/i);
      if (verAttrMatch) {
        version = verAttrMatch[1];
      } else {
        const verTagMatch = innerContent.match(/<Version>(.*?)<\/Version>/i);
        if (verTagMatch) {
          version = verTagMatch[1].trim();
        }
      }

      packageReferences[pkgName] = version;
    }

    return {
      projectName: fileName ? fileName.replace(/\.[^.]+$/, "") : undefined,
      targetFramework,
      packageReferences,
    };
  } catch {
    return null;
  }
}

/**
 * Checks whether a given path is a common Python manifest.
 */
export function isPythonManifest(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return (
    fileName === "pyproject.toml" ||
    /^requirements(-\w+)?\.txt$/i.test(fileName) ||
    fileName === "setup.py" ||
    fileName === "setup.cfg" ||
    fileName === "Pipfile"
  );
}

export interface PythonManifest {
  name?: string;
  version?: string;
  manifestType: "requirements.txt" | "pyproject.toml" | "setup.py" | "setup.cfg" | "Pipfile";
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Parses requirements.txt format.
 */
export function parseRequirementsTxt(contentOrPath: string): Record<string, string> {
  try {
    let raw = contentOrPath;
    if (fs.existsSync(contentOrPath)) {
      raw = fs.readFileSync(contentOrPath, "utf8");
    }
    const deps: Record<string, string> = {};
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) {
        continue;
      }
      const match = trimmed.match(/^([a-zA-Z0-9_\-\.]+)(?:\[[^\]]+\])?\s*([<>=!~].*)?$/);
      if (match) {
        const name = match[1];
        const spec = match[2]?.trim() || "*";
        deps[name] = spec;
      }
    }
    return deps;
  } catch {
    return {};
  }
}

/**
 * Deterministically parses a pyproject.toml manifest.
 */
export function parsePyprojectToml(contentOrPath: string): PythonManifest | null {
  try {
    let raw = contentOrPath;
    if (fs.existsSync(contentOrPath)) {
      raw = fs.readFileSync(contentOrPath, "utf8");
    }
    const lines = raw.split(/\r?\n/);
    const result: PythonManifest = {
      manifestType: "pyproject.toml",
      dependencies: {},
      devDependencies: {},
    };

    let section = "none";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const header = trimmed.slice(1, -1).trim();
        if (header === "project") section = "project";
        else if (header === "project.dependencies" || header === "tool.poetry.dependencies") section = "dependencies";
        else if (header === "project.optional-dependencies" || header === "tool.poetry.group.dev.dependencies" || header === "tool.poetry.dev-dependencies") section = "devDependencies";
        else section = "other";
        continue;
      }

      if (section === "project") {
        const nameMatch = trimmed.match(/^name\s*=\s*["']([^"']+)["']/);
        if (nameMatch) result.name = nameMatch[1];
        const verMatch = trimmed.match(/^version\s*=\s*["']([^"']+)["']/);
        if (verMatch) result.version = verMatch[1];
      } else if (section === "dependencies" || section === "devDependencies") {
        const arrayItemMatch = trimmed.match(/^["']([a-zA-Z0-9_\-\.]+)(?:\[[^\]]+\])?\s*([<>=!~].*)?["']/);
        if (arrayItemMatch) {
          const name = arrayItemMatch[1];
          const ver = arrayItemMatch[2]?.trim() || "*";
          const target = section === "dependencies" ? result.dependencies! : result.devDependencies!;
          target[name] = ver;
        } else {
          const kvMatch = trimmed.match(/^([a-zA-Z0-9_\-\.]+)\s*=\s*["']?([^"']+)["']?/);
          if (kvMatch && kvMatch[1].toLowerCase() !== "python") {
            const name = kvMatch[1];
            const ver = kvMatch[2].trim();
            const target = section === "dependencies" ? result.dependencies! : result.devDependencies!;
            target[name] = ver;
          }
        }
      }
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Checks whether a given path is a composer.json manifest.
 */
export function isComposerJson(filePath: string): boolean {
  return path.basename(filePath) === "composer.json";
}

export interface ComposerManifest {
  name?: string;
  description?: string;
  version?: string;
  type?: string;
  require?: Record<string, string>;
  requireDev?: Record<string, string>;
}

/**
 * Parses a composer.json file content or path.
 */
export function parseComposerJson(contentOrPath: string): ComposerManifest | null {
  try {
    let raw = contentOrPath;
    if (fs.existsSync(contentOrPath)) {
      raw = fs.readFileSync(contentOrPath, "utf8");
    }
    const json = JSON.parse(raw);
    return {
      name: json.name,
      description: json.description,
      version: json.version,
      type: json.type,
      require: json.require ?? {},
      requireDev: json["require-dev"] ?? {},
    };
  } catch {
    return null;
  }
}

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
  COMPOSER_MANIFEST_RULE,
  PYTHON_MANIFEST_RULE,
  DOTNET_MANIFEST_RULE,
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
