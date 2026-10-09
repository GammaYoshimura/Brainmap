import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "../core/paths.js";

export interface MissingDocumentIssue {
  referencingFile: string;
  referencedPath: string;
  resolvedPath: string;
}

export function checkReferencedDocumentExistence(
  targetDir: string,
  brainDir: string = path.join(targetDir, ".brain")
): MissingDocumentIssue[] {
  const issues: MissingDocumentIssue[] = [];
  if (!fs.existsSync(brainDir)) {
    return issues;
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

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  for (const filePath of mdFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const fileDir = path.dirname(filePath);
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(content)) !== null) {
      const rawTarget = match[2].trim();
      // Skip web links, anchors, mailto
      if (
        rawTarget.startsWith("http://") ||
        rawTarget.startsWith("https://") ||
        rawTarget.startsWith("#") ||
        rawTarget.startsWith("mailto:")
      ) {
        continue;
      }

      // Strip query or hash
      const cleanTarget = rawTarget.split("#")[0].split("?")[0];
      if (!cleanTarget) continue;

      let resolved: string;
      if (cleanTarget.startsWith("/")) {
        resolved = path.join(targetDir, cleanTarget.slice(1));
      } else {
        resolved = path.resolve(fileDir, cleanTarget);
      }

      if (!fs.existsSync(resolved)) {
        issues.push({
          referencingFile: normalizePath(path.relative(targetDir, filePath)),
          referencedPath: cleanTarget,
          resolvedPath: normalizePath(path.relative(targetDir, resolved)),
        });
      }
    }
  }

  return issues;
}
