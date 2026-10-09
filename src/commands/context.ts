import path from "node:path";
import { parseTaskQuery, TaskQuery } from "../router/query.js";
import {
  createContextInput,
  assembleContext,
  ContextSelectionInput,
} from "../context/context-selector.js";
import {
  formatContextText,
  formatContextJson,
  formatContextSummary,
} from "../context/formatter.js";

export const CONTEXT_SUCCESS = 0;
export const CONTEXT_FAILURE = 1;

export function resolveContextDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function contextCommand(args: string[] = []): number {
  const isJson = args.includes("--json");
  const isSummary = args.includes("--summary");
  const queryArgs = args.filter((a) => a !== "--json" && a !== "--summary");

  const query = parseTaskQuery(queryArgs);
  if (!query) {
    console.error("Please provide a task query.");
    console.error("Usage: brainmap context <query> [--json] [--summary]");
    return CONTEXT_FAILURE;
  }

  const targetDir = resolveContextDirectory();
  const contextInput = createContextInput(targetDir, query);
  const payload = assembleContext(contextInput);

  if (isJson) {
    console.log(formatContextJson(payload));
  } else if (isSummary) {
    console.log(formatContextSummary(payload));
  } else {
    console.log(formatContextText(payload));
  }

  return CONTEXT_SUCCESS;
}
