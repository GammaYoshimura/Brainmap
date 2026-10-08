import path from "node:path";
import { normalizePath } from "../core/paths.js";
import { FileModel } from "../core/model.js";

export interface EntryPointRule {
  id: string;
  description: string;
  matches: (relPath: string) => boolean;
}

/**
 * Known default entry point detection rules across major ecosystems.
 */
export const DEFAULT_ENTRY_POINT_RULES: EntryPointRule[] = [
  // JavaScript / TypeScript / Node
  {
    id: "js-ts-common-roots",
    description: "Common JS/TS entrypoints in root or src (index, main, app, server, cli)",
    matches: (p) => /(?:^|.*\/)(?:src\/)?(index|main|app|server|cli)\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(p),
  },
  {
    id: "js-ts-bin",
    description: "Executable scripts in bin directory",
    matches: (p) => /(?:^|.*\/)bin\/[^/]+\.(ts|js|mjs|cjs)$/i.test(p),
  },
  // Dart / Flutter
  {
    id: "dart-flutter-main",
    description: "Flutter or Dart entry point (lib/main.dart or main.dart)",
    matches: (p) => /(?:^|.*\/)(?:lib\/)?main\.dart$/i.test(p) || /(?:^|.*\/)bin\/[^/]+\.dart$/i.test(p),
  },
  // Python
  {
    id: "python-entrypoints",
    description: "Common Python entrypoints (main, app, __main__, manage, wsgi, asgi)",
    matches: (p) =>
      /(?:^|.*\/)(?:src\/)?(main|app|__main__|manage|wsgi|asgi)\.py$/i.test(p) ||
      /\/__main__\.py$/i.test(p),
  },
  // Rust
  {
    id: "rust-entrypoints",
    description: "Cargo binary or library entry points",
    matches: (p) =>
      /(?:^|.*\/)src\/(main|lib)\.rs$/i.test(p) ||
      /(?:^|.*\/)src\/bin\/[^/]+\.rs$/i.test(p) ||
      /(?:^|.*\/)examples\/[^/]+\.rs$/i.test(p),
  },
  // Go
  {
    id: "go-entrypoints",
    description: "Go root main or cmd application entry points",
    matches: (p) => /(?:^|.*\/)main\.go$/i.test(p) || /(?:^|.*\/)cmd\/[^/]+(\/[^/]+)?\/main\.go$/i.test(p),
  },
  // PHP
  {
    id: "php-entrypoints",
    description: "PHP entry points (index.php, public/index.php, artisan)",
    matches: (p) => /(?:^|.*\/)(?:public\/)?index\.php$/i.test(p) || /(?:^|.*\/)artisan$/i.test(p),
  },
  // C# / .NET
  {
    id: "dotnet-entrypoints",
    description: ".NET Program or Startup files",
    matches: (p) =>
      /(?:^|.*\/)(?:src\/[^/]+\/)?(Program|Startup)\.cs$/i.test(p),
  },
  // C / C++
  {
    id: "c-cpp-entrypoints",
    description: "C or C++ main source files",
    matches: (p) => /(?:^|.*\/)(?:src\/)?main\.(c|cpp|cc|cxx)$/i.test(p),
  },
];

/**
 * Determines whether a file path corresponds to an entry point.
 */
export function isEntryPoint(
  filePath: string,
  customRules: EntryPointRule[] = []
): boolean {
  const normalized = normalizePath(filePath).replace(/^\.\//, "");
  const rules = [...customRules, ...DEFAULT_ENTRY_POINT_RULES];

  return rules.some((rule) => rule.matches(normalized));
}

/**
 * Filters a list of files to return only identified entry points.
 */
export function detectEntryPoints(
  files: (FileModel | string)[],
  customRules?: EntryPointRule[]
): string[] {
  return files
    .map((f) => (typeof f === "string" ? f : f.relativePath))
    .filter((relPath) => isEntryPoint(relPath, customRules));
}
