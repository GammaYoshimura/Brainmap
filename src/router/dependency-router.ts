import { DependencyModel, FileModel } from "../core/model.js";
import { traverseProject, recordDiscoveredFiles } from "../scanner/scanner.js";
import { collectDeclaredDependencies } from "../detector/manifests.js";
import { TaskQuery } from "./query.js";
import { createRelevanceRanking, RankedItem, CandidateMatchInput } from "./ranking.js";

export interface RouteDependenciesOptions {
  dependencies?: DependencyModel[];
  files?: FileModel[];
}

export function routeRelevantDependencies(
  projectRoot: string,
  query: TaskQuery,
  options: RouteDependenciesOptions = {}
): RankedItem<DependencyModel>[] {
  let deps = options.dependencies;
  if (!deps) {
    let files = options.files;
    if (!files) {
      const traversal = traverseProject(projectRoot);
      files = recordDiscoveredFiles(traversal.files, traversal.rootPath);
    }
    deps = collectDeclaredDependencies(files, projectRoot);
  }

  if (deps.length === 0 || !query) {
    return [];
  }

  const candidateInputs: CandidateMatchInput[] = [];
  const tokenSet = new Set(query.tokens.map((t) => t.toLowerCase()));
  const normalizedRaw = query.raw.toLowerCase();
  const hasDependencyIntent = tokenSet.has("dependency") || tokenSet.has("dependencies") || tokenSet.has("package") || tokenSet.has("packages");

  for (const dep of deps) {
    const depNameLower = dep.name.toLowerCase();
    const unscopedName = depNameLower.replace(/^@[^/]+\//, "");
    let score = 0;
    const reasons: string[] = [];

    // 1. Direct name match in query raw or tokens
    if (tokenSet.has(depNameLower) || normalizedRaw.includes(depNameLower)) {
      score = 100;
      reasons.push(`exact dependency name match (${dep.name})`);
    } else if (unscopedName.length > 2 && (tokenSet.has(unscopedName) || normalizedRaw.includes(unscopedName))) {
      score = 85;
      reasons.push(`unscoped package name match (${unscopedName})`);
    } else {
      // Check partial token match for packages with hyphens/dots
      const parts = unscopedName.split(/[-_.]/).filter((p) => p.length > 2);
      const matchedPart = parts.find((p) => tokenSet.has(p));
      if (matchedPart) {
        score = 65;
        reasons.push(`package component match (${matchedPart})`);
      }
    }

    if (score > 0) {
      if (hasDependencyIntent) {
        score = Math.min(100, score + 10);
        reasons.push("dependency query intent");
      }

      for (const reason of reasons) {
        candidateInputs.push({
          path: `${dep.name}@${dep.version}`,
          category: "dependency",
          score,
          reason,
          metadata: dep,
        });
      }
    }
  }

  const ranked = createRelevanceRanking<DependencyModel>(candidateInputs);
  return ranked.filter((item) => item.category === "dependency");
}
