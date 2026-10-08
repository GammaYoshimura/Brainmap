import { TaskQuery } from "./query.js";
import { RankedItem } from "./ranking.js";
import { routeRelevantBrainDocs } from "./brain-doc-router.js";
import { routeRelevantSourceFiles } from "./source-file-router.js";
import { routeRelevantAdrs } from "./adr-router.js";
import { routeRelevantTests } from "./test-router.js";
import { routeRelevantDependencies } from "./dependency-router.js";

export interface RouteResult {
  query: string;
  projectRoot: string;
  brainDocs: RankedItem[];
  sourceFiles: RankedItem[];
  adrs: RankedItem[];
  tests: RankedItem[];
  dependencies: RankedItem[];
}

export function executeRouting(projectRoot: string, query: TaskQuery): RouteResult {
  const brainDocs = routeRelevantBrainDocs(projectRoot, query);
  const adrs = routeRelevantAdrs(projectRoot, query);
  const sourceFiles = routeRelevantSourceFiles(projectRoot, query);
  const tests = routeRelevantTests(projectRoot, query, {
    relevantSourceFiles: sourceFiles.map((s) => s.path),
  });
  const dependencies = routeRelevantDependencies(projectRoot, query);

  return {
    query: query.raw,
    projectRoot,
    brainDocs,
    sourceFiles,
    adrs,
    tests,
    dependencies,
  };
}

export function formatRouteResultText(result: RouteResult): string {
  const lines: string[] = [
    `Route Results for: "${result.query}"`,
    `Project: ${result.projectRoot}`,
    "",
  ];

  function formatSection(title: string, items: RankedItem[]): void {
    lines.push(`### ${title} (${items.length})`);
    if (items.length === 0) {
      lines.push("  (none found)");
    } else {
      for (const item of items) {
        lines.push(`  - [${item.score}] ${item.path} — ${item.reasons.join("; ")}`);
      }
    }
    lines.push("");
  }

  formatSection("Relevant Brain Documents", result.brainDocs);
  formatSection("Relevant ADRs", result.adrs);
  formatSection("Relevant Source Files", result.sourceFiles);
  formatSection("Relevant Tests", result.tests);
  formatSection("Relevant Dependencies", result.dependencies);

  return lines.join("\n").trim();
}

export function formatRouteResultJson(result: RouteResult, pretty = true): string {
  return pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);
}
