import fs from "node:fs";
import path from "node:path";

export const INIT_SUCCESS = 0;
export const INIT_FAILURE = 1;

export function resolveProjectDirectory(targetPath?: string): string {
  const dir = targetPath ? path.resolve(targetPath) : process.cwd();
  return dir;
}

export function brainExists(targetDir: string): boolean {
  const brainPath = path.join(targetDir, ".brain");
  return fs.existsSync(brainPath) && fs.statSync(brainPath).isDirectory();
}

export function initCommand(args: string[] = []): number {
  const targetDir = resolveProjectDirectory(args[0]);
  const exists = brainExists(targetDir);

  if (exists) {
    console.log(`.brain already exists in ${targetDir}`);
  } else {
    console.log(`Initializing Brainmap in ${targetDir}...`);
  }

  return INIT_SUCCESS;
}
