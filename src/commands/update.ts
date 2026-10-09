import path from "node:path";
import { createProjectModel } from "../core/model.js";
import { collectDeclaredDependencies } from "../detector/manifests.js";
import {
  traverseProject,
  recordDiscoveredFiles,
  recordDiscoveredDirectories,
  generateProjectSummary,
} from "../scanner/scanner.js";
import {
  loadPersistedScanState,
  computeProjectDiff,
  formatUpdateSummary,
  recomputeDependenciesForChangedFiles,
  updateProjectModelIncrementally,
  persistUpdatedState,
} from "../scanner/updater.js";
import { updateProjectMapIncrementally } from "../mapper/project-map.js";

export const UPDATE_SUCCESS = 0;
export const UPDATE_FAILURE = 1;

export function resolveUpdateDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function updateCommand(args: string[] = []): number {
  const unknownFlag = args.find((a) => a.startsWith("-"));
  if (unknownFlag) {
    console.error(`Unknown option: ${unknownFlag}`);
    return UPDATE_FAILURE;
  }

  const targetDir = resolveUpdateDirectory(args[0]);
  console.log(`Updating project state in ${targetDir}...`);

  const previousState = loadPersistedScanState(targetDir);
  if (!previousState || !previousState.files) {
    console.log("No previous scan state found. Run 'brainmap scan' first.");
    return UPDATE_FAILURE;
  }

  const traversal = traverseProject(targetDir);
  const currentFiles = recordDiscoveredFiles(traversal.files, traversal.rootPath);
  const diff = computeProjectDiff(currentFiles, previousState.files);

  if (!diff.hasChanges) {
    console.log("No project changes require processing. Project state is up to date.");
    return UPDATE_SUCCESS;
  }

  const directories = recordDiscoveredDirectories(traversal.directories, traversal.rootPath, traversal.files);
  const recomputedDeps = recomputeDependenciesForChangedFiles(
    [...diff.added, ...diff.modified],
    traversal.rootPath
  );

  const baseModel = previousState.model ?? {
    ...createProjectModel(path.basename(targetDir), traversal.rootPath),
    files: previousState.files ?? [],
    dependencies: collectDeclaredDependencies(previousState.files ?? [], traversal.rootPath),
  };

  const updatedModel = updateProjectModelIncrementally(baseModel, {
    addedFiles: diff.added,
    modifiedFiles: diff.modified,
    removedFiles: diff.removed,
    directories,
    recomputedDependencies: recomputedDeps,
  });

  const summary = generateProjectSummary(traversal.rootPath, updatedModel.files, directories);
  persistUpdatedState(targetDir, updatedModel, summary);

  const mapResult = updateProjectMapIncrementally(targetDir, updatedModel, directories);
  if (mapResult.updated) {
    console.log(`Incrementally updated project map in ${mapResult.path}`);
  }

  console.log(formatUpdateSummary(diff));
  console.log(`Successfully updated project state in ${targetDir}`);
  return UPDATE_SUCCESS;
}
