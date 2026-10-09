import path from "node:path";
import { updateHandoffDocument } from "../handoff/handoff-writer.js";

export const HANDOFF_SUCCESS = 0;
export const HANDOFF_FAILURE = 1;

export function resolveHandoffDirectory(targetPath?: string): string {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

export function handoffCommand(args: string[] = []): number {
  const targetDir = resolveHandoffDirectory(args[0]);
  console.log(`Generating handoff in ${targetDir}...`);
  const updatedPath = updateHandoffDocument(targetDir);
  console.log(`Successfully updated handoff at ${updatedPath}`);
  return HANDOFF_SUCCESS;
}
