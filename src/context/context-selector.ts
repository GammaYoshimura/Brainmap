import { TaskQuery } from "../router/query.js";
import { RouteResult, executeRouting } from "../router/route-pipeline.js";
import { selectRelevantBrainDocuments } from "./brain-doc-selector.js";
import { selectRelevantSourceCode } from "./source-code-selector.js";
import { prioritizeContextItems } from "./prioritizer.js";
import { ContextSizeBudget, createContextBudget } from "./context-limits.js";
import { ContextPayload } from "./formatter.js";

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

export function assembleContext(
  input: ContextSelectionInput,
  budget?: ContextSizeBudget
): ContextPayload {
  const effectiveBudget =
    budget ??
    (input.options?.maxCharacters
      ? createContextBudget(input.options.maxCharacters)
      : createContextBudget());

  const brainDocs = selectRelevantBrainDocuments(input);
  const sourceFiles = selectRelevantSourceCode(input);
  const { items, omittedCount } = prioritizeContextItems(
    brainDocs,
    sourceFiles,
    effectiveBudget
  );

  const totalCharacters = items.reduce((acc, it) => acc + it.characters, 0);

  return {
    query: input.routeResult.query,
    projectRoot: input.projectRoot,
    items,
    omittedCount,
    totalCharacters,
  };
}
