# Project State

Current operational state of the Brainmap project.

## Current Milestone

**M168**: Return meaningful exit codes.

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
  - Implemented exported symbol extraction and symbol-matching resolver (`src/router/symbol-matcher.ts`).
  - Implemented relevance ranking engine with score aggregation, reason tracking, and category weighting (`src/router/ranking.ts`).
  - Implemented relevant Brain document router discovering all Brain files and scoring them against query criteria (`src/router/brain-doc-router.ts`).
  - Implemented relevant source file router integrating paths, filenames, subsystems, and symbol extraction (`src/router/source-file-router.ts`).
  - Implemented relevant ADR router extracting decision metadata, status, keywords, and relevance scoring (`src/router/adr-router.ts`).
  - Implemented relevant test router linking direct test mentions and matching test files corresponding to relevant source files (`src/router/test-router.ts`).
  - Implemented relevant dependency router matching declared manifest packages against task queries (`src/router/dependency-router.ts`).
  - Implemented structured routing pipeline and output formatters for text and JSON (`src/router/route-pipeline.ts`, `src/commands/route.ts`).
  - Added routing end-to-end integration test suite verifying documents, ADRs, source files, tests, and dependencies across fixtures (`tests/routing-e2e.test.ts`).

- **Context Selection (M133–M144)**:
  - Created `context` command handler (`src/commands/context.ts`) and registered `context` in CLI entry point and help text (`src/cli.ts`).
  - Added natural-language task query acceptance, parsing, validation, and CLI invocation handling (`src/commands/context.ts`).
  - Implemented routing integration for context selection (`createContextInput`), using `RouteResult` as the foundational input model (`src/context/context-selector.ts`).
  - Implemented relevant Brain document selector (`selectRelevantBrainDocuments`), reading and sizing relevant Brain markdown documents and ADRs (`src/context/brain-doc-selector.ts`).
  - Implemented relevant source code and test selector (`selectRelevantSourceCode`), extracting scored candidate source and test files (`src/context/source-code-selector.ts`).
  - Implemented relevance filtering and low-relevance exclusion (`filterByRelevance`, `minRelevanceScore`), pruning noisy candidates (`src/context/relevance-filter.ts`).
  - Implemented configurable context-size limits and budget controls (`createContextBudget`, `canIncludeInBudget`, `truncateContentToLimit`) (`src/context/context-limits.ts`).
  - Implemented relevance-based prioritization and budget-aware assembly (`prioritizeContextItems`) ordering by score, type hierarchy, and path ties (`src/context/prioritizer.ts`).
  - Implemented plain-text context output formatting (`formatContextText`) with file delimiters, scores, and metadata (`src/context/formatter.ts`).
  - Implemented JSON context output formatting (`formatContextJson`) and CLI `--json` support with end-to-end context assembly (`assembleContext`) (`src/context/formatter.ts`, `src/context/context-selector.ts`, `src/commands/context.ts`).
  - Implemented concise context summary generation and formatting (`generateContextSummary`, `formatContextSummary`) and CLI `--summary` flag (`src/context/formatter.ts`, `src/commands/context.ts`).
  - Added comprehensive context-selection unit, budget limit, formatting, and end-to-end CLI integration test suite (`tests/context.test.ts`, `tests/context-e2e.test.ts`).

- **Handoff (M145–M158)**:
  - M145: Created `handoff` command handler (`src/commands/handoff.ts`), wired command dispatch and help description in CLI entry point (`src/cli.ts`).
  - M146: Implemented state reader (`src/handoff/state-reader.ts`) to parse and structure operational state from `.brain/state.md`.
  - M147: Implemented milestone reader (`src/handoff/milestone-reader.ts`) extracting active milestone codes and titles.
  - M148: Implemented recent changes detector (`src/handoff/change-detector.ts`) extracting git commit log records and commit summaries.
  - M149: Implemented changed files detector (`src/handoff/file-change-detector.ts`) extracting staged, unstaged, untracked, and recent commit changed files.
  - M150: Implemented test status reader (`src/handoff/test-status-reader.ts`) extracting test suite execution metrics and pass/fail states.
  - M151: Implemented issue detector (`src/handoff/issue-detector.ts`) detecting recorded blockers and known open issues.
  - M152: Implemented CURRENT MILESTONE section generator (`src/handoff/section-current-milestone.ts`).
  - M153: Implemented COMPLETED section generator (`src/handoff/section-completed.ts`).
  - M154: Implemented OPEN ISSUES section generator (`src/handoff/section-open-issues.ts`).
  - M155: Implemented NEXT ACTION section generator (`src/handoff/section-next-action.ts`).
  - M156: Implemented CONTEXT TO LOAD section generator (`src/handoff/section-context-to-load.ts`).
  - M157: Implemented handoff document update and writer (`src/handoff/handoff-writer.ts`) updating `.brain/handoff.md`.
  - M158: Added comprehensive handoff test suite (`tests/handoff.test.ts`, `tests/handoff-e2e.test.ts`).

- **Health Checks (M159–M169)**:
  - M159: Created `check` command handler (`src/commands/check.ts`), wired command dispatch and help description in CLI entry point (`src/cli.ts`).
  - M160: Implemented referenced document existence checker (`src/checker/doc-existence-checker.ts`) verifying all internal document links in `.brain`.
  - M161: Implemented broken Markdown link detector (`src/checker/markdown-link-checker.ts`) validating files, anchors, and path structures.
  - M162: Implemented missing source file reference detector (`src/checker/source-ref-checker.ts`) validating code paths mentioned across documentation.
  - M163: Implemented subsystem routing checker (`src/checker/subsystem-routing-checker.ts`) detecting missing index documents, unregistered subsystems, and dangling router links.
  - M164: Implemented duplicate reference detector (`src/checker/duplicate-ref-checker.ts`) flagging redundant identical links in the same document.
  - M165: Implemented routing inconsistency checker (`src/checker/routing-inconsistency-checker.ts`) detecting missing core constitution documents, missing router targets, and circular references.
  - M166: Implemented map synchronization checker (`src/checker/map-sync-checker.ts`) detecting changed source files not yet mapped in `.brain/project-map.md`.
  - M167: Implemented health report generator (`src/checker/health-reporter.ts`) and wired formatted diagnostic reporting into `brainmap check`.
  - M168: Implemented meaningful exit codes returning `CHECK_SUCCESS = 0` on healthy status and `CHECK_FAILURE = 1` when problems are detected.

## What is In Progress

- Health Checks block (M159–M169).

## Known Blockers

- None.

## Relevant Current Conditions

- Environment: Node.js v20+, TypeScript 5+, zero runtime dependencies.
- Git repository synced with remote (`https://github.com/GammaYoshimura/Brainmap`).
- 195 passing tests across the test suite.

## Immediate Next Work

- M169: Add health-check tests.
