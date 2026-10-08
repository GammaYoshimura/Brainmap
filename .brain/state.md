# Project State

Current operational state of the Brainmap project.

## Current Milestone

**M102**: Create manifest mapping.

## What is Implemented

- **Repository Foundation (M001–M010)**:
  - Minimal English `README.md` with project description and setup instructions.
  - `.gitignore` for dependencies, builds, and system artifacts.
  - Directory structure (`src/`, `tests/`).
  - Package manifest (`package.json`, `tsconfig.json`) configured for Node.js ESM and TypeScript.
  - CLI entry point (`src/cli.ts`) with no-argument execution, minimal help output (`--help`), and exit codes (`EXIT_SUCCESS = 0`, `EXIT_FAILURE = 1`).
  - Automated test runner setup (`node:test`) with passing test suite (`tests/cli.test.ts`).
- **Brain Foundation (M011–M025)**:
  - Hierarchical `.brain/` directory structure created.
  - Core documents: `index.md`, `architecture.md`, `state.md`, `handoff.md`, `routing.md`.
  - Directories: `decisions/`, `subsystems/`.
  - ADR 0001 created and ADR format documented.
  - Basic Brain structure validation (`src/core/brain-validator.ts`).
- **Internal Project Model (M026–M035)**:
  - Project, file, directory, dependency, brain document, and diagnostic models.
  - JSON serialization and deserialization with roundtrip validation.
- **`brainmap init` (M036–M052)**:
  - Deterministic and idempotent project initialization CLI command.
- **Ignore Rules & Traversal (M053–M061)**:
  - Gitignore parser, exclusion configuration, and standard ignore filtering.
- **`brainmap scan` (M062–M073)**:
  - Recursive traversal, language detection, project scan summary, and state persistence.
- **`brainmap update` (M074–M085)**:
  - Incremental project updates, change detection (added, modified, removed files), diff formatting.
- **Project Structure Detection (M086–M096)**:
  - Entry-point detection mechanism and ecosystem patterns (`src/detector/entrypoints.ts`).
  - Manifest registry and detectors for `package.json`, `pubspec.yaml`, `composer.json`, Python manifests (`pyproject.toml`, `requirements.txt`), .NET manifests (`*.csproj`), and Cargo (`Cargo.toml`) (`src/detector/manifests.ts`).
  - Declared dependencies extraction across all supported manifests.
  - Comprehensive end-to-end detection test suite (`tests/detection.test.ts`).
- **`brainmap map` (M097–M102)**:
  - Created `map` command handler (`src/commands/map.ts`) and registered `map` in CLI entry point and help text (`src/cli.ts`).
  - Created directory-map generation and Markdown formatting (`src/mapper/directory-map.ts`).
  - Created file-map generation with directory grouping, size formatting, and metadata (`src/mapper/file-map.ts`).
  - Created module-map generation with structural heuristics and Markdown formatting (`src/mapper/module-map.ts`).
  - Created entry-point mapping with role inference (CLI, server, app, library) and Markdown formatting (`src/mapper/entrypoint-map.ts`).
  - Created manifest mapping with package metadata, ecosystem identification, and dependency counting (`src/mapper/manifest-map.ts`).

## What is In Progress

- Completing M102: Create manifest mapping.

## Known Blockers

- None.

## Relevant Current Conditions

- Environment: Node.js v20+, TypeScript 5+, zero runtime dependencies.
- Git repository synced with remote (`https://github.com/GammaYoshimura/Brainmap`).
- 52 passing tests across the test suite.

## Immediate Next Work

- **M103**: Create declared-dependency mapping.
- **M104**: Generate `project-map.md`.
