import fs from "node:fs";
import path from "node:path";
import {
  traverseProject,
  recordDiscoveredFiles,
  recordDiscoveredDirectories,
  generateProjectSummary,
  formatProjectSummary,
  persistScanResults,
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

  const brainDir = path.join(targetDir, ".brain");
  if (fs.existsSync(brainDir) && fs.statSync(brainDir).isDirectory()) {
    const savedPath = persistScanResults(brainDir, summary, undefined, files);
    console.log(`Scan results persisted to ${savedPath}`);
  }

  return SCAN_SUCCESS;
}
