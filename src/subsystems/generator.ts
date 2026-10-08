import fs from "node:fs";
import path from "node:path";
import { SubsystemGrouping } from "./groupings.js";
import { normalizePath } from "../core/paths.js";
import {
  identifyImportantSubsystemFiles,
  formatImportantFiles,
  ImportantSubsystemFile,
} from "./important-files.js";
import {
  recordSubsystemEntryPoints,
  formatSubsystemEntryPoints,
  SubsystemEntryPoint,
} from "./entrypoints.js";
import {
  recordSubsystemDependencies,
  formatSubsystemDependencies,
  SubsystemDependencyRecord,
} from "./dependencies.js";
import {
  recordRelatedBrainDocuments,
  formatRelatedBrainDocuments,
  RelatedBrainDocRef,
} from "./related-brain-docs.js";
import { DependencyModel, BrainDocumentModel } from "../core/model.js";

/**
 * Result of generating a document for a subsystem.
 */
export interface GeneratedSubsystemDocument {
  subsystemId: string;
  subsystemName: string;
  filePath: string;
  content: string;
}

/**
 * Options for subsystem document generation.
 */
export interface SubsystemDocOptions {
  customDescription?: string;
  importantFiles?: string[];
  entryPoints?: string[];
  dependencies?: string[];
  allGroupings?: SubsystemGrouping[];
  declaredDependencies?: DependencyModel[];
  projectRoot?: string;
  brainDir?: string;
  brainDocuments?: BrainDocumentModel[];
  relatedBrainDocs?: Array<{ name: string; path: string }>;
}

/**
 * Generates the Markdown documentation content for a detected subsystem grouping.
 */
export function generateSubsystemDocument(
  grouping: SubsystemGrouping,
  options: SubsystemDocOptions = {}
): string {
  const lines: string[] = [];

  const title = grouping.name.toLowerCase().endsWith("subsystem")
    ? grouping.name
    : `${grouping.name} Subsystem`;

  lines.push(`# ${title}`);
  lines.push("");
  lines.push(options.customDescription || `Architectural specification and context for the \`${grouping.id}\` subsystem.`);
  lines.push("");
  lines.push("## Overview");
  lines.push("");
  lines.push(`- **Subsystem ID**: \`${grouping.id}\``);
  lines.push(`- **Location**: \`${normalizePath(grouping.path)}\``);
  lines.push(`- **Files Count**: ${grouping.files.length}`);
  const langs = grouping.languages.length > 0 ? grouping.languages.join(", ") : "Not specified";
  lines.push(`- **Primary Languages**: ${langs}`);
  lines.push(`- **Detection Confidence**: ${grouping.confidence} (${grouping.reason})`);
  lines.push("");

  // Important Files section (M112)
  lines.push("## Important Files");
  lines.push("");
  if (options.importantFiles && options.importantFiles.length > 0) {
    for (const f of options.importantFiles) {
      lines.push(`- \`${normalizePath(f)}\``);
    }
  } else {
    const important = identifyImportantSubsystemFiles(grouping);
    lines.push(...formatImportantFiles(important));
  }
  lines.push("");

  // Entry Points section (M113)
  lines.push("## Entry Points");
  lines.push("");
  if (options.entryPoints && options.entryPoints.length > 0) {
    for (const ep of options.entryPoints) {
      lines.push(`- \`${normalizePath(ep)}\``);
    }
  } else {
    const entryPoints = recordSubsystemEntryPoints(grouping);
    lines.push(...formatSubsystemEntryPoints(entryPoints));
  }
  lines.push("");

  // Dependencies section (M114)
  lines.push("## Subsystem Dependencies");
  lines.push("");
  if (options.dependencies && options.dependencies.length > 0) {
    for (const dep of options.dependencies) {
      lines.push(`- ${dep}`);
    }
  } else {
    const deps = recordSubsystemDependencies(
      grouping,
      options.allGroupings || [],
      options.declaredDependencies || [],
      options.projectRoot
    );
    lines.push(...formatSubsystemDependencies(deps));
  }
  lines.push("");

  // Related Brain Documents section (M115)
  lines.push("## Related Brain Documents");
  lines.push("");
  if (options.relatedBrainDocs && options.relatedBrainDocs.length > 0) {
    for (const doc of options.relatedBrainDocs) {
      lines.push(`- [${doc.name}](${normalizePath(doc.path)})`);
    }
  } else {
    const related = recordRelatedBrainDocuments(
      grouping.id,
      options.brainDir,
      options.brainDocuments
    );
    lines.push(...formatRelatedBrainDocuments(related));
  }
  lines.push("");

  return lines.join("\n");
}

/**
 * Generates and writes documentation files for all detected subsystems.
 * Creates .brain/subsystems/<subsystemId>/index.md for each subsystem.
 */
export function generateDocumentsForSubsystems(
  groupings: SubsystemGrouping[],
  subsystemsBaseDir: string,
  optionsMap: Record<string, SubsystemDocOptions> = {}
): GeneratedSubsystemDocument[] {
  const generated: GeneratedSubsystemDocument[] = [];

  for (const grouping of groupings) {
    const targetDir = path.join(subsystemsBaseDir, grouping.id);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, "index.md");
    const options = {
      allGroupings: groupings,
      ...optionsMap[grouping.id],
    };
    const content = generateSubsystemDocument(grouping, options);

    fs.writeFileSync(filePath, content, "utf8");

    generated.push({
      subsystemId: grouping.id,
      subsystemName: grouping.name,
      filePath: normalizePath(filePath),
      content,
    });
  }

  return generated;
}
