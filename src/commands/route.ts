import path from "node:path";
import { parseTaskQuery, TaskQuery } from "../router/query.js";

export const ROUTE_SUCCESS = 0;
export const ROUTE_FAILURE = 1;

export function resolveRouteDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function routeCommand(args: string[] = []): number {
  const query = parseTaskQuery(args);
  if (!query) {
    console.error("Please provide a task query.");
    console.error("Usage: brainmap route <query>");
    return ROUTE_FAILURE;
  }

  const targetDir = resolveRouteDirectory();
  console.log(`Routing task query: "${query.raw}" in ${targetDir}...`);
  return ROUTE_SUCCESS;
}
