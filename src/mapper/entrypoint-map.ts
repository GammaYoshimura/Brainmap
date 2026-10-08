import { FileModel } from "../core/model.js";
import { isEntryPoint } from "../detector/entrypoints.js";

export type EntryPointKind = "cli" | "server" | "app" | "library" | "generic";

export interface EntryPointMapEntry {
  relativePath: string;
  name: string;
  language?: string;
  kind: EntryPointKind;
  description: string;
}

export function inferEntryPointKind(name: string, relativePath: string): { kind: EntryPointKind; description: string } {
  const lowerName = name.toLowerCase();
  const lowerPath = relativePath.toLowerCase();

  if (lowerName.startsWith("cli.") || lowerPath.includes("/cli/") || lowerPath.includes("\\cli\\")) {
    return { kind: "cli", description: "Command-Line Interface entry point" };
  }
  if (
    lowerName.startsWith("server.") ||
    lowerName === "app.py" ||
    lowerName === "app.js" ||
    lowerName === "app.ts" ||
    lowerName === "index.php"
  ) {
    return { kind: "server", description: "Application server / web entry point" };
  }
  if (lowerName.startsWith("main.")) {
    return { kind: "app", description: "Main application entry point" };
  }
  if (lowerName.startsWith("index.") || lowerName === "lib.rs" || lowerName === "__init__.py") {
    return { kind: "library", description: "Package or library root entry point" };
  }
  return { kind: "generic", description: "Project entry point" };
}

export function buildEntryPointMap(files: FileModel[]): EntryPointMapEntry[] {
  const entryFiles = files.filter((f) => Boolean(f.isEntrypoint || isEntryPoint(f.relativePath)));
  const sorted = [...entryFiles].sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return sorted.map((file) => {
    const { kind, description } = inferEntryPointKind(file.name, file.relativePath);
    return {
      relativePath: file.relativePath,
      name: file.name,
      language: file.language,
      kind,
      description,
    };
  });
}

export function formatEntryPointMap(entries: EntryPointMapEntry[]): string {
  if (entries.length === 0) {
    return "### Entry Points\n\nNo entry points detected.\n";
  }

  const lines: string[] = ["### Entry Points", ""];

  for (const entry of entries) {
    const langDisplay = entry.language ? `${entry.language}, ` : "";
    const kindBadge = entry.kind.toUpperCase();
    lines.push(`- **\`${entry.relativePath}\`** [${kindBadge}] — ${langDisplay}${entry.description}`);
  }

  return lines.join("\n") + "\n";
}
