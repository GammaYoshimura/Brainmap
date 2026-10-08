import path from "node:path";
import { parseTaskQuery, TaskQuery } from "../router/query.js";
import {
  executeRouting,
  formatRouteResultText,
  formatRouteResultJson,
  RouteResult,
} from "../router/route-pipeline.js";

export const ROUTE_SUCCESS = 0;
export const ROUTE_FAILURE = 1;

export function resolveRouteDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function routeCommand(args: string[] = []): number {
  const isJson = args.includes("--json");
  const queryArgs = args.filter((a) => a !== "--json");

  const query = parseTaskQuery(queryArgs);
  if (!query) {
    console.error("Please provide a task query.");
    console.error("Usage: brainmap route <query> [--json]");
    return ROUTE_FAILURE;
  }

  const targetDir = resolveRouteDirectory();
  const result = executeRouting(targetDir, query);

  if (isJson) {
    console.log(formatRouteResultJson(result));
  } else {
    console.log(formatRouteResultText(result));
  }

  return ROUTE_SUCCESS;
}
