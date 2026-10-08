# Project State

Current operational state of the Brainmap project.

## Current Milestone

**M123**: Resolve Brain-document matches.

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
- **`brainmap map` (M097–M108)**:
  - Created `map` command handler (`src/commands/map.ts`) and registered `map` in CLI entry point and help text (`src/cli.ts`).
  - Created directory-map generation and Markdown formatting (`src/mapper/directory-map.ts`).
  - Created file-map generation with directory grouping, size formatting, and metadata (`src/mapper/file-map.ts`).
  - Created module-map generation with structural heuristics and Markdown formatting (`src/mapper/module-map.ts`).
  - Created entry-point mapping with role inference (CLI, server, app, library) and Markdown formatting (`src/mapper/entrypoint-map.ts`).
  - Created manifest mapping with package metadata, ecosystem identification, and dependency counting (`src/mapper/manifest-map.ts`).
  - Created declared-dependency mapping categorized by production, development, peer, and optional scopes (`src/mapper/dependency-map.ts`).
  - Implemented `project-map.md` synthesis engine and file generator (`src/mapper/project-map.ts`).
  - Added global routing link from `.brain/index.md` and automated routing integration in `ensureProjectMapRoutingInIndex`.
  - Implemented incremental map updates synchronized with `brainmap update` workflow (`src/mapper/project-map.ts`, `src/commands/update.ts`).
  - Created change-relevance detector evaluating structural, manifest, entry-point, and module impacts of diffs (`src/mapper/change-detector.ts`).
  - Created comprehensive unit, edge-case, and end-to-end test suite for mapping across multi-stack fixtures (`tests/mapper.test.ts`).
- **Specialized Documentation (M109–M117)**:
  - Created subsystem index generation (`src/subsystems/subsystem-index.ts`) supporting individual subsystem index generation (`generateSubsystemIndex`) and master subsystems index generation (`generateSubsystemsIndex`).
  - Implemented natural subsystem grouping detection (`src/subsystems/groupings.ts`) analyzing container prefixes (`src/`, `lib/`, `packages/`), top-level architectural domain folders, entry-point groupings, and flat-structure fallbacks.
  - Implemented subsystem document generation (`src/subsystems/generator.ts`) generating comprehensive Markdown documentation per detected subsystem grouping into `.brain/subsystems/<id>/index.md`.
  - Created important subsystem file identification and prioritization (`src/subsystems/important-files.ts`), identifying core domain files, contracts/types, facades, entry points, and configurations.
  - Implemented subsystem entry point recording (`src/subsystems/entrypoints.ts`), capturing executable entry points, module export facades, and handler dispatchers.
  - Implemented subsystem dependency recording (`src/subsystems/dependencies.ts`), statically resolving internal cross-subsystem imports, declared external package dependencies, and standard library runtimes.
  - Implemented related Brain documents recording (`src/subsystems/related-brain-docs.ts`), establishing two-way links between subsystems and architectural constitution, global routers, project maps, and relevant ADRs.
  - Implemented subsystem routing integration (`src/subsystems/routing.ts`), synchronizing subsystem router links into `.brain/index.md` and generating the master `.brain/subsystems/index.md`.
  - Added specialized documentation end-to-end integration and edge-case test suite (`tests/docgen-e2e.test.ts`).
- **Routing (M118–M132)**:
  - Created `route` command handler (`src/commands/route.ts`) and registered `route` command in CLI entry point and help text (`src/cli.ts`).
  - Implemented task query parser, query normalization, tokenization, and CLI argument handling (`src/router/query.ts`, `src/commands/route.ts`).
  - Implemented exact path matching resolver against candidate project and brain paths (`src/router/path-matcher.ts`).
  - Implemented file name and stem matching resolver against candidate project and brain paths (`src/router/filename-matcher.ts`).
  - Implemented subsystem matching resolver with identifier, name, path, and token heuristics (`src/router/subsystem-matcher.ts`).
  - Implemented Brain document matching resolver with role-intent keywords, paths, and subsystem tokens (`src/router/brain-doc-matcher.ts`).

## What is In Progress

- Completing M123: Resolve Brain-document matches.

## Known Blockers

- None.

## Relevant Current Conditions

- Environment: Node.js v20+, TypeScript 5+, zero runtime dependencies.
- Git repository synced with remote (`https://github.com/GammaYoshimura/Brainmap`).
- 116 passing tests across the test suite.

## Immediate Next Work

- Next milestone: **M124: Resolve symbol matches where supported**.
