import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "../core/paths.js";

/**
 * Reference to a specialized document within a subsystem.
 */
export interface SubsystemDocRef {
  name: string;
  path: string;
  description?: string;
}

/**
 * Data structure representing a subsystem for index generation.
 */
export interface SubsystemIndexData {
  id: string;
  name: string;
  path: string;
  description: string;
  documents?: SubsystemDocRef[];
}

/**
 * Generates Markdown content for a single subsystem index (index.md).
 * Follows the Brainmap hierarchical routing pattern.
 */
export function generateSubsystemIndex(data: SubsystemIndexData): string {
  const lines: string[] = [];

  const title = data.name.toLowerCase().endsWith("subsystem")
    ? data.name
    : `${data.name} Subsystem`;

  lines.push(`# ${title}`);
  lines.push("");
  lines.push(data.description || "Subsystem-specific knowledge and architectural specifications.");
  lines.push("");
  lines.push("## Overview");
  lines.push("");
  lines.push(`- **Subsystem ID**: \`${data.id}\``);
  lines.push(`- **Source Path**: \`${normalizePath(data.path)}\``);
  lines.push("");
  lines.push("## Documents");
  lines.push("");

  if (data.documents && data.documents.length > 0) {
    for (const doc of data.documents) {
      const docPath = normalizePath(doc.path);
      const desc = doc.description ? `: ${doc.description}` : "";
      lines.push(`- [${doc.name}](${docPath})${desc}`);
    }
  } else {
    lines.push("_No specialized documents registered yet._");
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Generates Markdown content for the master subsystems index (.brain/subsystems/index.md).
 * Lists all registered or detected subsystems in the project.
 */
export function generateSubsystemsIndex(subsystems: SubsystemIndexData[]): string {
  const lines: string[] = [];

  lines.push("# Subsystems Index");
  lines.push("");
  lines.push("Index of project subsystems and specialized architectural documentation.");
  lines.push("");
  lines.push("## Available Subsystems");
  lines.push("");

  if (subsystems.length === 0) {
    lines.push("_No subsystems defined or detected yet._");
    lines.push("");
    return lines.join("\n");
  }

  const sorted = [...subsystems].sort((a, b) => a.id.localeCompare(b.id));

  for (const sub of sorted) {
    const title = sub.name.toLowerCase().endsWith("subsystem")
      ? sub.name
      : `${sub.name} Subsystem`;
    const docLink = `${sub.id}/index.md`;
    const desc = sub.description ? ` - ${sub.description}` : "";
    lines.push(`- **[${title}](${docLink})** (\`${normalizePath(sub.path)}\`)${desc}`);
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Writes the subsystem index.md into the subsystem directory.
 */
export function writeSubsystemIndex(
  subsystemsDir: string,
  data: SubsystemIndexData
): string {
  const targetDir = path.join(subsystemsDir, data.id);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, "index.md");
  const content = generateSubsystemIndex(data);
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

/**
 * Writes the master subsystems index.md into the subsystems root directory.
 */
export function writeSubsystemsMasterIndex(
  subsystemsDir: string,
  subsystems: SubsystemIndexData[]
): string {
  if (!fs.existsSync(subsystemsDir)) {
    fs.mkdirSync(subsystemsDir, { recursive: true });
  }

  const filePath = path.join(subsystemsDir, "index.md");
  const content = generateSubsystemsIndex(subsystems);
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}
