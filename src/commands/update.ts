import path from "node:path";
import { traverseProject, recordDiscoveredFiles } from "../scanner/scanner.js";
import { loadPersistedScanState, computeProjectDiff } from "../scanner/updater.js";

export const UPDATE_SUCCESS = 0;
export const UPDATE_FAILURE = 1;

export function resolveUpdateDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function updateCommand(args: string[] = []): number {
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

  return UPDATE_SUCCESS;
}
