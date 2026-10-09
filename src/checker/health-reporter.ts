import path from "node:path";
import { checkReferencedDocumentExistence, MissingDocumentIssue } from "./doc-existence-checker.js";
import { detectBrokenMarkdownLinks, BrokenMarkdownLink } from "./markdown-link-checker.js";
import { detectMissingSourceFileReferences, MissingSourceReference } from "./source-ref-checker.js";
import { detectSubsystemRoutingProblems, SubsystemRoutingIssue } from "./subsystem-routing-checker.js";
import { detectObviousDuplicateReferences, DuplicateReferenceIssue } from "./duplicate-ref-checker.js";
import { detectBasicRoutingInconsistencies, RoutingInconsistencyIssue } from "./routing-inconsistency-checker.js";
import { detectUnreflectedMapChanges, MapSyncIssue } from "./map-sync-checker.js";

export interface HealthReport {
  targetDir: string;
  isHealthy: boolean;
  totalIssues: number;
  missingDocuments: MissingDocumentIssue[];
  brokenLinks: BrokenMarkdownLink[];
  missingSourceRefs: MissingSourceReference[];
  subsystemIssues: SubsystemRoutingIssue[];
  duplicateRefs: DuplicateReferenceIssue[];
  routingInconsistencies: RoutingInconsistencyIssue[];
  unreflectedMapChanges: MapSyncIssue[];
}

export function runHealthChecks(targetDir: string): HealthReport {
  const brainDir = path.join(targetDir, ".brain");

  const missingDocuments = checkReferencedDocumentExistence(targetDir, brainDir);
  const brokenLinks = detectBrokenMarkdownLinks(targetDir, brainDir);
  const missingSourceRefs = detectMissingSourceFileReferences(targetDir, brainDir);
  const subsystemIssues = detectSubsystemRoutingProblems(targetDir, brainDir);
  const duplicateRefs = detectObviousDuplicateReferences(targetDir, brainDir);
  const routingInconsistencies = detectBasicRoutingInconsistencies(targetDir, brainDir);
  const unreflectedMapChanges = detectUnreflectedMapChanges(targetDir, brainDir);

  const totalIssues =
    missingDocuments.length +
    brokenLinks.length +
    missingSourceRefs.length +
    subsystemIssues.length +
    duplicateRefs.length +
    routingInconsistencies.length +
    unreflectedMapChanges.length;

  return {
    targetDir,
    isHealthy: totalIssues === 0,
    totalIssues,
    missingDocuments,
    brokenLinks,
    missingSourceRefs,
    subsystemIssues,
    duplicateRefs,
    routingInconsistencies,
    unreflectedMapChanges,
  };
}

export function formatHealthReport(report: HealthReport): string {
  const lines: string[] = [];
  lines.push(`Brain Health Report for: ${report.targetDir}`);
  lines.push(`Status: ${report.isHealthy ? "HEALTHY" : "PROBLEMS DETECTED"}`);
  lines.push(`Total Issues: ${report.totalIssues}`);

  if (report.totalIssues === 0) {
    lines.push("\nAll integrity and routing checks passed cleanly.");
    return lines.join("\n");
  }

  if (report.missingDocuments.length > 0) {
    lines.push(`\n### Missing Documents (${report.missingDocuments.length}):`);
    for (const d of report.missingDocuments) {
      lines.push(`  - [${d.referencingFile}] references missing [${d.referencedPath}]`);
    }
  }

  if (report.brokenLinks.length > 0) {
    lines.push(`\n### Broken Links (${report.brokenLinks.length}):`);
    for (const b of report.brokenLinks) {
      lines.push(`  - [${b.file}] broken target: "${b.target}" (${b.reason})`);
    }
  }

  if (report.missingSourceRefs.length > 0) {
    lines.push(`\n### Missing Source Code References (${report.missingSourceRefs.length}):`);
    for (const s of report.missingSourceRefs) {
      lines.push(`  - [${s.documentFile}] references missing file: \`${s.referencedFile}\``);
    }
  }

  if (report.subsystemIssues.length > 0) {
    lines.push(`\n### Subsystem Routing Issues (${report.subsystemIssues.length}):`);
    for (const sub of report.subsystemIssues) {
      lines.push(`  - ${sub.details}`);
    }
  }

  if (report.duplicateRefs.length > 0) {
    lines.push(`\n### Duplicate References (${report.duplicateRefs.length}):`);
    for (const dup of report.duplicateRefs) {
      lines.push(`  - [${dup.documentFile}] references "${dup.target}" ${dup.count} times`);
    }
  }

  if (report.routingInconsistencies.length > 0) {
    lines.push(`\n### Routing Inconsistencies (${report.routingInconsistencies.length}):`);
    for (const r of report.routingInconsistencies) {
      lines.push(`  - ${r.details}`);
    }
  }

  if (report.unreflectedMapChanges.length > 0) {
    lines.push(`\n### Unreflected Project Map Changes (${report.unreflectedMapChanges.length}):`);
    for (const u of report.unreflectedMapChanges) {
      lines.push(`  - Changed file \`${u.unmappedFile}\` is not mapped in project-map.md`);
    }
  }

  return lines.join("\n");
}
