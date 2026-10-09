import path from "node:path";

export const HANDOFF_SUCCESS = 0;
export const HANDOFF_FAILURE = 1;

export function resolveHandoffDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function handoffCommand(args: string[] = []): number {
  const targetDir = resolveHandoffDirectory(args[0]);
  console.log(`Generating handoff in ${targetDir}...`);
  return HANDOFF_SUCCESS;
}
