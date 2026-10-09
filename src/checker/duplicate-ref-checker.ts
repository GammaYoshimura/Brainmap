import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "../core/paths.js";

export interface DuplicateReferenceIssue {
  documentFile: string;
  target: string;
  count: number;
}

export function detectObviousDuplicateReferences(
  targetDir: string,
  brainDir: string = path.join(targetDir, ".brain")
): DuplicateReferenceIssue[] {
  const duplicates: DuplicateReferenceIssue[] = [];
  if (!fs.existsSync(brainDir)) {
    return duplicates;
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
    const relDoc = normalizePath(path.relative(targetDir, filePath));

    const targetCounts = new Map<string, number>();
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(content)) !== null) {
      const target = match[2].trim();
      targetCounts.set(target, (targetCounts.get(target) || 0) + 1);
    }

    for (const [target, count] of targetCounts.entries()) {
      if (count > 1) {
        duplicates.push({
          documentFile: relDoc,
          target,
          count,
        });
      }
    }
  }

  return duplicates;
}
