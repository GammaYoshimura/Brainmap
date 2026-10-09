import path from "node:path";
import { runHealthChecks, formatHealthReport } from "../checker/health-reporter.js";

export const CHECK_SUCCESS = 0;
export const CHECK_FAILURE = 1;

export function resolveCheckDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function checkCommand(args: string[] = []): number {
  const unknownFlag = args.find((a) => a.startsWith("-"));
  if (unknownFlag) {
    console.error(`Unknown option: ${unknownFlag}`);
    return CHECK_FAILURE;
  }

  const targetDir = resolveCheckDirectory(args[0]);
  console.log(`Running health checks in ${targetDir}...`);
  const report = runHealthChecks(targetDir);
  console.log(formatHealthReport(report));
  return report.isHealthy ? CHECK_SUCCESS : CHECK_FAILURE;
}
