import fs from "node:fs";
import path from "node:path";

export interface BrainValidationResult {
  valid: boolean;
  missing: string[];
}

export const REQUIRED_BRAIN_FILES = [
  "index.md",
  "architecture.md",
  "state.md",
  "handoff.md",
] as const;

export const REQUIRED_BRAIN_DIRS = [
  "decisions",
  "subsystems",
] as const;

export function validateBrainStructure(projectRoot: string): BrainValidationResult {
  const brainDir = path.join(projectRoot, ".brain");
  const missing: string[] = [];

  if (!fs.existsSync(brainDir) || !fs.statSync(brainDir).isDirectory()) {
    return {
      valid: false,
      missing: [".brain/"],
    };
  }

  for (const file of REQUIRED_BRAIN_FILES) {
    const filePath = path.join(brainDir, file);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      missing.push(`.brain/${file}`);
    }
  }

  for (const dir of REQUIRED_BRAIN_DIRS) {
    const dirPath = path.join(brainDir, dir);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      missing.push(`.brain/${dir}/`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
