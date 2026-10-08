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

export const DEFAULT_ARCHITECTURE_TEMPLATE = `# Architecture

Global architectural constitution.

## 1. Core Principles

- High cohesion and low coupling across modules.
- Deterministic behavior and clear ownership of data.
- Small, focused files and single-responsibility components.

## 2. Subsystem Boundaries

- Define clear boundaries between presentation, business logic, and data layers.
- Avoid circular dependencies between modules.

## 3. Dependency Rules

- Core domain logic must not depend on external UI frameworks.
- Dependencies flow inward toward domain models.

## 4. Architectural Invariants

- Preserve codebase consistency and established patterns.
- Keep architectural documentation synchronized with actual code.
`;

export function createBrainArchitectureFile(brainDir: string): string {
  const archPath = path.join(brainDir, "architecture.md");
  if (!fs.existsSync(archPath)) {
    fs.writeFileSync(archPath, DEFAULT_ARCHITECTURE_TEMPLATE, "utf8");
  }
  return archPath;
}

export const DEFAULT_STATE_TEMPLATE = `# Project State

Current project state and development status.

## Current Milestone

- Initial setup

## What is Implemented

- Initial project structure initialized.

## What is In Progress

- Project configuration and architecture design.

## Known Blockers

- None.

## Relevant Current Conditions

- Brain initialized.

## Immediate Next Work

- Define core domain models and modules.
- Set up automated testing pipeline.
`;

export function createBrainStateFile(brainDir: string): string {
  const statePath = path.join(brainDir, "state.md");
  if (!fs.existsSync(statePath)) {
    fs.writeFileSync(statePath, DEFAULT_STATE_TEMPLATE, "utf8");
  }
  return statePath;
}

export const DEFAULT_HANDOFF_TEMPLATE = `# Handoff

Session-to-session continuation document.

### CURRENT MILESTONE
Initial project setup.

### COMPLETED
- Initialized Brain structure via brainmap init.

### IN PROGRESS
- Initial project configuration.

### CHANGED FILES
- .brain/index.md
- .brain/architecture.md
- .brain/state.md
- .brain/handoff.md

### TEST STATUS
- Not run yet.

### OPEN ISSUES
- None.

### IMPORTANT DECISIONS
- None.

### NEXT ACTION
- Define initial subsystem boundaries and specifications.

### CONTEXT TO LOAD
- .brain/index.md
- .brain/architecture.md
- .brain/state.md
`;

export function createBrainHandoffFile(brainDir: string): string {
  const handoffPath = path.join(brainDir, "handoff.md");
  if (!fs.existsSync(handoffPath)) {
    fs.writeFileSync(handoffPath, DEFAULT_HANDOFF_TEMPLATE, "utf8");
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
