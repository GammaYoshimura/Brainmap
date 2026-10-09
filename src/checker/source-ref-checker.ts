import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "../core/paths.js";

export interface MissingSourceReference {
  documentFile: string;
  referencedFile: string;
}

export function detectMissingSourceFileReferences(
  targetDir: string,
  brainDir: string = path.join(targetDir, ".brain")
): MissingSourceReference[] {
  const missing: MissingSourceReference[] = [];
  if (!fs.existsSync(brainDir)) {
    return missing;
  }

  const scanMarkdownFiles = (dir: string): string[] => {
    let results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(scanMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(fullPath);
      }
    }
    return results;
  };

  const mdFiles = scanMarkdownFiles(brainDir);

  // Matches backtick paths looking like source files: e.g. `src/foo.ts`, `lib/app.dart`
  const codeBacktickRegex = /`([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)`/g;

  // Extensions typical for source code, configs, manifests
  const sourceExts = new Set([
    "ts", "tsx", "js", "jsx", "mjs", "cjs", "dart", "py", "rs", "go",
    "cs", "java", "kt", "php", "rb", "cpp", "c", "h", "json", "yaml", "yml", "toml"
  ]);

  for (const docPath of mdFiles) {
    const content = fs.readFileSync(docPath, "utf8");
    const relDoc = normalizePath(path.relative(targetDir, docPath));
    let match: RegExpExecArray | null;

    while ((match = codeBacktickRegex.exec(content)) !== null) {
      const candidate = match[1].trim();

      // Skip dependencies, package names, command flags, or markdown docs
      if (
        candidate.startsWith("-") ||
        candidate.endsWith(".md") ||
        candidate.startsWith("http") ||
        candidate.includes(" ") ||
        !candidate.includes(".")
      ) {
        continue;
      }

      const ext = candidate.split(".").pop()?.toLowerCase();
      if (!ext || !sourceExts.has(ext)) {
        continue;
      }

      // Ignore generic filenames without path like "tsconfig.json" if checked against root,
      // but if candidate starts with src/, tests/, lib/ or existing root files:
      const candidateNormalized = normalizePath(candidate);

      const resolved = path.resolve(targetDir, candidateNormalized);
      if (
        (candidateNormalized.includes("/") || candidateNormalized === "package.json" || candidateNormalized === "tsconfig.json") &&
        !fs.existsSync(resolved)
      ) {
        missing.push({
          documentFile: relDoc,
          referencedFile: candidateNormalized,
        });
      }
    }
  }

  return missing;
}
