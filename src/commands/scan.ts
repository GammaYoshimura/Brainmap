import path from "node:path";
import {
  traverseProject,
  recordDiscoveredFiles,
  recordDiscoveredDirectories,
  generateProjectSummary,
  formatProjectSummary,
} from "../scanner/scanner.js";

export const SCAN_SUCCESS = 0;
export const SCAN_FAILURE = 1;

export function resolveScanDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function scanCommand(args: string[] = []): number {
  const targetDir = resolveScanDirectory(args[0]);
  console.log(`Scanning project in ${targetDir}...`);

  const traversal = traverseProject(targetDir);
  const files = recordDiscoveredFiles(traversal.files, traversal.rootPath);
  const directories = recordDiscoveredDirectories(traversal.directories, traversal.rootPath, traversal.files);
  const summary = generateProjectSummary(traversal.rootPath, files, directories);

  console.log(formatProjectSummary(summary));
  return SCAN_SUCCESS;
}
