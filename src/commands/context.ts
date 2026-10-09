import path from "node:path";

export const CONTEXT_SUCCESS = 0;
export const CONTEXT_FAILURE = 1;

export function resolveContextDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function contextCommand(args: string[] = []): number {
  const targetDir = resolveContextDirectory();
  console.log(`Selecting context in ${targetDir}...`);
  return CONTEXT_SUCCESS;
}
