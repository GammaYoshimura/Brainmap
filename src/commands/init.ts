import fs from "node:fs";
import path from "node:path";

export const INIT_SUCCESS = 0;
export const INIT_FAILURE = 1;

export function resolveProjectDirectory(targetPath?: string): string {
  const dir = targetPath ? path.resolve(targetPath) : process.cwd();
  return dir;
}

export function brainExists(targetDir: string): boolean {
  const brainPath = path.join(targetDir, ".brain");
  return fs.existsSync(brainPath) && fs.statSync(brainPath).isDirectory();
}

export function ensureBrainDirectory(targetDir: string): string {
  const brainPath = path.join(targetDir, ".brain");
  if (!fs.existsSync(brainPath)) {
    fs.mkdirSync(brainPath, { recursive: true });
  }
  return brainPath;
}

export const DEFAULT_INDEX_TEMPLATE = `# Brain Index

Global router for project knowledge.

## Root Brain Documents

- [architecture.md](architecture.md): Global architectural constitution, principles, and invariants.
- [state.md](state.md): Current project state, implemented features, and immediate next steps.
- [handoff.md](handoff.md): Session continuation document for AI agents and developers.
- [decisions/](decisions/): Directory of Architectural Decision Records (ADRs).
- [subsystems/](subsystems/): Directory of subsystem-specific indexes and documentation.
`;

export function createBrainIndexFile(brainDir: string): string {
  const indexPath = path.join(brainDir, "index.md");
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, DEFAULT_INDEX_TEMPLATE, "utf8");
  }
  return indexPath;
}

export function createBrainArchitectureFile(brainDir: string): string {
  const archPath = path.join(brainDir, "architecture.md");
  if (!fs.existsSync(archPath)) {
    fs.writeFileSync(archPath, "# Architecture\n\nGlobal architectural constitution.\n", "utf8");
  }
  return archPath;
}

export function createBrainStateFile(brainDir: string): string {
  const statePath = path.join(brainDir, "state.md");
  if (!fs.existsSync(statePath)) {
    fs.writeFileSync(statePath, "# Project State\n\nCurrent project state.\n", "utf8");
  }
  return statePath;
}

export function createBrainHandoffFile(brainDir: string): string {
  const handoffPath = path.join(brainDir, "handoff.md");
  if (!fs.existsSync(handoffPath)) {
    fs.writeFileSync(handoffPath, "# Handoff\n\nSession-to-session continuation document.\n", "utf8");
  }
  return handoffPath;
}

export function createBrainDecisionsDirectory(brainDir: string): string {
  const decisionsPath = path.join(brainDir, "decisions");
  if (!fs.existsSync(decisionsPath)) {
    fs.mkdirSync(decisionsPath, { recursive: true });
  }
  return decisionsPath;
}

export function createBrainSubsystemsDirectory(brainDir: string): string {
  const subsystemsPath = path.join(brainDir, "subsystems");
  if (!fs.existsSync(subsystemsPath)) {
    fs.mkdirSync(subsystemsPath, { recursive: true });
  }
  return subsystemsPath;
}

export function initCommand(args: string[] = []): number {
  const targetDir = resolveProjectDirectory(args[0]);
  const exists = brainExists(targetDir);

  if (exists) {
    console.log(`.brain already exists in ${targetDir}`);
    return INIT_SUCCESS;
  }

  console.log(`Initializing Brainmap in ${targetDir}...`);
  const brainDir = ensureBrainDirectory(targetDir);
  createBrainIndexFile(brainDir);
  createBrainArchitectureFile(brainDir);
  createBrainStateFile(brainDir);
  createBrainHandoffFile(brainDir);
  createBrainDecisionsDirectory(brainDir);
  createBrainSubsystemsDirectory(brainDir);
  return INIT_SUCCESS;
}
