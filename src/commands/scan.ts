import path from "node:path";

export const SCAN_SUCCESS = 0;
export const SCAN_FAILURE = 1;

export function resolveScanDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function scanCommand(args: string[] = []): number {
  const targetDir = resolveScanDirectory(args[0]);
  console.log(`Scanning project in ${targetDir}...`);
  return SCAN_SUCCESS;
}
