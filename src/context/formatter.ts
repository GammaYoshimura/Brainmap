import { PrioritizedContextItem } from "./prioritizer.js";

export interface ContextPayload {
  query: string;
  projectRoot: string;
  items: PrioritizedContextItem[];
  omittedCount: number;
  totalCharacters: number;
}

export function formatContextText(payload: ContextPayload): string {
  const lines: string[] = [
    `=== Brainmap Context for: "${payload.query}" ===`,
    `Project: ${payload.projectRoot}`,
    `Included Items: ${payload.items.length}${
      payload.omittedCount > 0 ? ` (${payload.omittedCount} omitted by budget)` : ""
    }`,
    `Total Characters: ${payload.totalCharacters}`,
    "",
  ];

  for (const item of payload.items) {
    const typeLabel =
      item.type === "brain-doc"
        ? "BRAIN DOC"
        : item.type === "test"
        ? "TEST"
        : "SOURCE FILE";
    lines.push(
      `--- [${typeLabel}] ${item.path} (score: ${item.score}${
        item.truncated ? ", truncated" : ""
      }) ---`
    );
    lines.push(item.content);
    lines.push("");
  }

  lines.push("=== End of Context ===");
  return lines.join("\n").trim();
}

export function formatContextJson(payload: ContextPayload, pretty = true): string {
  return pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
}

export interface ContextSummary {
  query: string;
  totalIncluded: number;
  brainDocsCount: number;
  sourceFilesCount: number;
  testsCount: number;
  omittedCount: number;
  totalCharacters: number;
}

export function generateContextSummary(payload: ContextPayload): ContextSummary {
  const brainDocsCount = payload.items.filter((i) => i.type === "brain-doc").length;
  const sourceFilesCount = payload.items.filter((i) => i.type === "source-file").length;
  const testsCount = payload.items.filter((i) => i.type === "test").length;

  return {
    query: payload.query,
    totalIncluded: payload.items.length,
    brainDocsCount,
    sourceFilesCount,
    testsCount,
    omittedCount: payload.omittedCount,
    totalCharacters: payload.totalCharacters,
  };
}

export function formatContextSummary(payload: ContextPayload): string {
  const summary = generateContextSummary(payload);
  const lines: string[] = [
    `Context Summary for: "${summary.query}"`,
    `  Included files: ${summary.totalIncluded} (${summary.brainDocsCount} brain docs, ${summary.sourceFilesCount} source files, ${summary.testsCount} tests)`,
    `  Total characters: ${summary.totalCharacters}`,
  ];
  if (summary.omittedCount > 0) {
    lines.push(`  Omitted due to budget limits: ${summary.omittedCount}`);
  }
  return lines.join("\n");
}
