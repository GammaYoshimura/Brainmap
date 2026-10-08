import fs from "node:fs";
import path from "node:path";
import { PersistedScanState } from "./scanner.js";

export function getPersistedScanPath(projectRoot: string): string {
  return path.join(projectRoot, ".brain", "scan.json");
}

export function loadPersistedScanState(projectRoot: string): PersistedScanState | null {
  const scanPath = getPersistedScanPath(projectRoot);
  if (!fs.existsSync(scanPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(scanPath, "utf8");
    return JSON.parse(raw) as PersistedScanState;
  } catch {
    return null;
  }
}
