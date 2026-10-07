# Architecture

Global architectural constitution for Brainmap.

## 1. Core Principles

- **Model & Language Agnostic**: Brainmap operates independently of specific LLM providers and target programming languages.
- **Token Efficiency**: Maximize information density by minimizing irrelevant context loaded by AI agents.
- **Deterministic Foundation**: Core discovery, scanning, path resolution, and routing rely on deterministic static analysis.
- **Hierarchical Knowledge Routing**: Routing follows a strict tiered hierarchy:
  - Global Router (`.brain/index.md`)
  - Subsystem Routers (`.brain/subsystems/*/index.md`)
  - Specialized Knowledge Documents
- **Minimal Dependencies**: Rely on standard library capabilities where feasible; avoid introducing unnecessary external libraries.

## 2. Subsystem Boundaries

- **CLI Layer (`src/cli.ts`, `src/cli/`)**: Command parsing, user interaction, human-readable formatting, exit code orchestration.
- **Core Model (`src/core/`)**: Data representations of projects, files, directories, dependencies, Brain documents, and diagnostics.
- **Scanner Subsystem**: Deterministic filesystem traversal, ignore rules enforcement, file extension and language categorization.
- **Mapper Subsystem**: High-level structural mapping, manifest analysis, entry-point discovery.
- **Router Subsystem**: Context selection and relevance scoring mapping task prompts to minimal sufficient context.
- **Checker Subsystem**: Brain integrity verification, broken link detection, path consistency validation.

## 3. Dependency Rules

- Core domain models must not depend on CLI or presentation layers.
- Deterministic analysis components must not depend on network access or proprietary cloud APIs.
- Subsystem implementations communicate via explicit typed contracts.

## 4. Invariants

- English-first policy for all CLI output, templates, and built-in metadata.
- User source files and documentation are preserved verbatim.
