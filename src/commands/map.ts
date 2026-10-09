import fs from "node:fs";
import path from "node:path";
import { traverseProject, recordDiscoveredFiles, recordDiscoveredDirectories } from "../scanner/scanner.js";
import { generateProjectMapContent, writeProjectMap } from "../mapper/project-map.js";
import { collectDeclaredDependencies } from "../detector/manifests.js";
import {
  detectNaturalSubsystemGroupings,
  generateDocumentsForSubsystems,
  syncSubsystemRouting,
  SubsystemDocOptions,
} from "../subsystems/index.js";

export const MAP_SUCCESS = 0;
export const MAP_FAILURE = 1;

export function resolveMapDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function mapCommand(args: string[] = []): number {
  const unknownFlag = args.find((a) => a.startsWith("-"));
  if (unknownFlag) {
    console.error(`Unknown option: ${unknownFlag}`);
    return MAP_FAILURE;
  }

  const targetDir = resolveMapDirectory(args[0]);
  console.log(`Mapping project in ${targetDir}...`);

  const traversal = traverseProject(targetDir);
  const files = recordDiscoveredFiles(traversal.files, traversal.rootPath);
  const directories = recordDiscoveredDirectories(traversal.directories, traversal.rootPath, traversal.files);
  const dependencies = collectDeclaredDependencies(files, targetDir);

  const content = generateProjectMapContent({
    projectName: path.basename(targetDir),
    projectRoot: targetDir,
    files,
    directories,
    dependencies,
  });

  const savedPath = writeProjectMap(targetDir, content);
  console.log(`Project map generated at ${savedPath}`);

  // Integrate subsystem documentation generation when .brain exists
  const brainDir = path.join(targetDir, ".brain");
  if (fs.existsSync(brainDir) && fs.statSync(brainDir).isDirectory()) {
    const groupings = detectNaturalSubsystemGroupings(files, directories, path.basename(targetDir));
    if (groupings.length > 0) {
      const subsystemsDir = path.join(brainDir, "subsystems");
      const optionsMap: Record<string, SubsystemDocOptions> = {};
      for (const g of groupings) {
        optionsMap[g.id] = {
          declaredDependencies: dependencies,
          projectRoot: targetDir,
          brainDir,
        };
      }
      const generated = generateDocumentsForSubsystems(groupings, subsystemsDir, optionsMap);
      syncSubsystemRouting(brainDir, groupings);
      console.log(`Generated documentation for ${generated.length} subsystem(s)`);
    }
  }

  return MAP_SUCCESS;
}
