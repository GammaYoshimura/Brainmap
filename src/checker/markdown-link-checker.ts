import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "../core/paths.js";

export interface BrokenMarkdownLink {
  file: string;
  linkText: string;
  target: string;
  reason: "missing_file" | "missing_anchor" | "malformed";
}

export function detectBrokenMarkdownLinks(
  targetDir: string,
  brainDir: string = path.join(targetDir, ".brain")
): BrokenMarkdownLink[] {
  const brokenLinks: BrokenMarkdownLink[] = [];
  if (!fs.existsSync(brainDir)) {
    return brokenLinks;
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
      const linkText = match[1].trim();
      const rawTarget = match[2].trim();

      if (
        rawTarget.startsWith("http://") ||
        rawTarget.startsWith("https://") ||
        rawTarget.startsWith("mailto:")
      ) {
        continue;
      }

      const relFile = normalizePath(path.relative(targetDir, filePath));

      if (rawTarget.startsWith("#")) {
        const anchor = rawTarget.slice(1).toLowerCase();
        // Look for heading matching anchor slug in the same file
        const headings = (content.match(/^#{1,6}\s+(.+)$/gm) || []).map((h) =>
          h
            .replace(/^#{1,6}\s+/, "")
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
        );

        if (!headings.includes(anchor)) {
          brokenLinks.push({
            file: relFile,
            linkText,
            target: rawTarget,
            reason: "missing_anchor",
          });
        }
        continue;
      }

      const [pathPart, anchorPart] = rawTarget.split("#");
      const cleanPath = pathPart.split("?")[0].trim();

      if (!cleanPath) {
        brokenLinks.push({
          file: relFile,
          linkText,
          target: rawTarget,
          reason: "malformed",
        });
        continue;
      }

      let resolved: string;
      if (cleanPath.startsWith("/")) {
        resolved = path.join(targetDir, cleanPath.slice(1));
      } else {
        resolved = path.resolve(fileDir, cleanPath);
      }

      if (!fs.existsSync(resolved)) {
        brokenLinks.push({
          file: relFile,
          linkText,
          target: rawTarget,
          reason: "missing_file",
        });
      } else if (anchorPart && fs.statSync(resolved).isFile()) {
        const targetContent = fs.readFileSync(resolved, "utf8");
        const anchor = anchorPart.toLowerCase();
        const headings = (targetContent.match(/^#{1,6}\s+(.+)$/gm) || []).map((h) =>
          h
            .replace(/^#{1,6}\s+/, "")
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
        );
        if (!headings.includes(anchor)) {
          brokenLinks.push({
            file: relFile,
            linkText,
            target: rawTarget,
            reason: "missing_anchor",
          });
        }
      }
    }
  }

  return brokenLinks;
}
