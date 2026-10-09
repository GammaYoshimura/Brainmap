import { TaskQuery } from "../router/query.js";
import { RouteResult, executeRouting } from "../router/route-pipeline.js";

export interface ContextOptions {
  maxCharacters?: number;
  minRelevanceScore?: number;
}

export interface ContextSelectionInput {
  projectRoot: string;
  routeResult: RouteResult;
  options?: ContextOptions;
}

export function createContextInput(
  projectRoot: string,
  query: TaskQuery,
  options?: ContextOptions
): ContextSelectionInput {
  const routeResult = executeRouting(projectRoot, query);
  return {
    projectRoot,
    routeResult,
    options,
  };
}
