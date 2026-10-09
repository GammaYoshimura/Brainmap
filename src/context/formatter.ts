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
