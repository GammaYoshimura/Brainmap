import path from "node:path";

export const ROUTE_SUCCESS = 0;
export const ROUTE_FAILURE = 1;

export function resolveRouteDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function routeCommand(args: string[] = []): number {
  const targetDir = resolveRouteDirectory();
  console.log(`Routing context in ${targetDir}...`);
  return ROUTE_SUCCESS;
}
