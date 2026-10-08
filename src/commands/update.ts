import path from "node:path";

export const UPDATE_SUCCESS = 0;
export const UPDATE_FAILURE = 1;

export function resolveUpdateDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function updateCommand(args: string[] = []): number {
  const targetDir = resolveUpdateDirectory(args[0]);
  console.log(`Updating project state in ${targetDir}...`);
  return UPDATE_SUCCESS;
}
