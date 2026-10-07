# Project State

Current operational state of the Brainmap project.

## Current Milestone

**M020**: Document the current project state.

## What is Implemented

- **Repository Foundation (M001–M010)**:
  - Minimal English `README.md` with project description and setup instructions.
  - `.gitignore` for dependencies, builds, and system artifacts.
  - Directory structure (`src/`, `tests/`).
  - Package manifest (`package.json`, `tsconfig.json`) configured for Node.js ESM and TypeScript.
  - CLI entry point (`src/cli.ts`) with no-argument execution, minimal help output (`--help`), and exit codes (`EXIT_SUCCESS = 0`, `EXIT_FAILURE = 1`).
  - Automated test runner setup (`node:test`) with passing test suite (`tests/cli.test.ts`).
- **Brain Foundation (M011–M019)**:
  - Hierarchical `.brain/` directory structure created.
  - Core documents created: `index.md`, `architecture.md`, `state.md`, `handoff.md`.
  - Directories created: `decisions/`, `subsystems/`.
  - Documented role of each root Brain file in `index.md`.
  - Documented initial global architectural principles, boundaries, and rules in `architecture.md`.

## What is In Progress

- Completing M020: Documenting the current project state.

## Known Blockers

- None.

## Relevant Current Conditions

- Environment: Node.js v20+, TypeScript 5+, zero runtime dependencies.
- Git repository synced with remote (`https://github.com/GammaYoshimura/Brainmap`).

## Immediate Next Work

- **M021**: Create the first ADR (`0001-use-typescript-and-builtin-node-runner.md`).
- **M022**: Document the ADR format.
- **M023**: Document the handoff format.
- **M024**: Document the routing principles.
- **M025**: Add a basic validation that the Brain structure exists.
