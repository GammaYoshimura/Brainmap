import path from "node:path";

export const INIT_SUCCESS = 0;
export const INIT_FAILURE = 1;

export function resolveProjectDirectory(targetPath?: string): string {
  const dir = targetPath ? path.resolve(targetPath) : process.cwd();
  return dir;
}

export function initCommand(args: string[] = []): number {
  const targetDir = resolveProjectDirectory(args[0]);
  console.log(`Initializing Brainmap in ${targetDir}...`);
  return INIT_SUCCESS;
}
