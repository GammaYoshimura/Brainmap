import path from "node:path";

export const MAP_SUCCESS = 0;
export const MAP_FAILURE = 1;

export function resolveMapDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function mapCommand(args: string[] = []): number {
  const targetDir = resolveMapDirectory(args[0]);
  console.log(`Mapping project in ${targetDir}...`);
  return MAP_SUCCESS;
}
