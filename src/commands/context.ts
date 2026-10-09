import path from "node:path";
import { parseTaskQuery, TaskQuery } from "../router/query.js";

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
  console.log(`Selecting context for: "${query.raw}" in ${targetDir}...`);
  return CONTEXT_SUCCESS;
}
