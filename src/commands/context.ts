import path from "node:path";
import { parseTaskQuery, TaskQuery } from "../router/query.js";
import {
  createContextInput,
  assembleContext,
  ContextSelectionInput,
} from "../context/context-selector.js";
import { createContextBudget } from "../context/context-limits.js";
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
  let isJson = false;
  let isSummary = false;
  let maxCharacters: number | undefined;
  let maxFiles: number | undefined;
  let minScore: number | undefined;
  const queryWords: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--json") {
      isJson = true;
    } else if (arg === "--summary") {
      isSummary = true;
    } else if (arg === "--max-chars" || arg === "--max-characters") {
      const val = parseInt(args[++i], 10);
      if (isNaN(val) || val <= 0) {
        console.error(`Invalid value for ${arg}`);
        return CONTEXT_FAILURE;
      }
      maxCharacters = val;
    } else if (arg === "--max-files") {
      const val = parseInt(args[++i], 10);
      if (isNaN(val) || val <= 0) {
        console.error(`Invalid value for ${arg}`);
        return CONTEXT_FAILURE;
      }
      maxFiles = val;
    } else if (arg === "--min-score") {
      const val = parseInt(args[++i], 10);
      if (isNaN(val) || val < 0) {
        console.error(`Invalid value for ${arg}`);
        return CONTEXT_FAILURE;
      }
      minScore = val;
    } else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      return CONTEXT_FAILURE;
    } else {
      queryWords.push(arg);
    }
  }

  const query = parseTaskQuery(queryWords);
  if (!query) {
    console.error("Please provide a task query.");
    console.error("Usage: brainmap context <query> [--json] [--summary] [--max-chars <chars>] [--max-files <files>] [--min-score <score>]");
    return CONTEXT_FAILURE;
  }

  const targetDir = resolveContextDirectory();
  const contextInput = createContextInput(targetDir, query, {
    maxCharacters,
    minRelevanceScore: minScore,
  });
  const budget =
    maxFiles !== undefined || maxCharacters !== undefined
      ? createContextBudget(maxCharacters, maxFiles)
      : undefined;
  const payload = assembleContext(contextInput, budget);

  if (isJson) {
    console.log(formatContextJson(payload));
  } else if (isSummary) {
    console.log(formatContextSummary(payload));
  } else {
    console.log(formatContextText(payload));
  }

  return CONTEXT_SUCCESS;
}
