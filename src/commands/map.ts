import path from "node:path";
import { traverseProject, recordDiscoveredFiles, recordDiscoveredDirectories } from "../scanner/scanner.js";
import { generateProjectMapContent, writeProjectMap } from "../mapper/project-map.js";

export const MAP_SUCCESS = 0;
export const MAP_FAILURE = 1;

export function resolveMapDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function mapCommand(args: string[] = []): number {
  const targetDir = resolveMapDirectory(args[0]);
  console.log(`Mapping project in ${targetDir}...`);

  const traversal = traverseProject(targetDir);
  const files = recordDiscoveredFiles(traversal.files, traversal.rootPath);
  const directories = recordDiscoveredDirectories(traversal.directories, traversal.rootPath, traversal.files);

  const content = generateProjectMapContent({
    projectName: path.basename(targetDir),
    projectRoot: targetDir,
    files,
    directories,
  });

  const savedPath = writeProjectMap(targetDir, content);
  console.log(`Project map generated at ${savedPath}`);
  return MAP_SUCCESS;
}
