# Brainmap

Model-agnostic project memory and context-routing tool for AI-assisted software development.

## Status

Active development (Health Checks & Integrity Foundation completed; experimental pre-release).

## Overview

Brainmap organizes and navigates software project knowledge so that AI coding agents can work with persistent, structured, and minimal context. Rather than providing entire repositories to AI models, Brainmap indexes project structure, dependencies, decisions, and subsystem boundaries, enabling precise context retrieval.

### Implemented Capabilities

- **`brainmap init`**: Initializes standard hierarchical `.brain/` structure (`index.md`, `architecture.md`, `state.md`, `handoff.md`, `decisions/`, `subsystems/`).
- **`brainmap scan`**: Deterministically analyzes project structure, file types, languages, and declared manifests.
- **`brainmap update`**: Performs incremental update detection using SHA-256 content hashes, reconciling modified, added, and removed files and dependencies.
- **`brainmap map`**: Generates `project-map.md` and automated subsystem documentation with global routing synchronization.
- **`brainmap route <query>`**: Routes natural-language task queries to relevant Brain documents, ADRs, source files, tests, and dependencies.
- **`brainmap context <query>`**: Assembles budget-constrained, prioritized context payloads with relevance-aware truncation for AI workflows.
- **`brainmap handoff`**: Synthesizes session-to-session continuation documentation with active milestones, changed files, and test metrics.
- **`brainmap check`**: Verifies Brain integrity, link consistency, document references, and routing health.

## Development Setup

### Prerequisites

- Node.js (version 20 or later)
- npm (version 10 or later)

### Installation (from source)

Clone the repository and install dependencies:

```bash
git clone https://github.com/GammaYoshimura/Brainmap.git
cd Brainmap
npm install
```

### Build

Compile TypeScript source files to `dist/`:

```bash
npm run build
```

### Testing

Run the test suite using Node's built-in test runner:

```bash
npm test
```

### Running the CLI Locally

Execute the compiled CLI:

```bash
npm start
# or directly:
node dist/src/cli.js --help
```
