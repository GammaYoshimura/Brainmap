import path from "node:path";
import { parseTaskQuery, TaskQuery } from "../router/query.js";
import { createContextInput, ContextSelectionInput } from "../context/context-selector.js";

export const CONTEXT_SUCCESS = 0;
export const CONTEXT_FAILURE = 1;

export function resolveContextDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function contextCommand(args: string[] = []): number {
  const query = parseTaskQuery(args);
  if (!query) {
    console.error("Please provide a task query.");
    console.error("Usage: brainmap context <query>");
    return CONTEXT_FAILURE;
  }

  const targetDir = resolveContextDirectory();
  const contextInput = createContextInput(targetDir, query);
  console.log(
    `Selecting context for: "${query.raw}" in ${targetDir} (routing input: ${contextInput.routeResult.brainDocs.length} brain docs, ${contextInput.routeResult.sourceFiles.length} source files)...`
  );
  return CONTEXT_SUCCESS;
}
