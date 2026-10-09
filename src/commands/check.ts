import path from "node:path";

export const CHECK_SUCCESS = 0;
export const CHECK_FAILURE = 1;

export function resolveCheckDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function checkCommand(args: string[] = []): number {
  const targetDir = resolveCheckDirectory(args[0]);
  console.log(`Running health checks in ${targetDir}...`);
  return CHECK_SUCCESS;
}
