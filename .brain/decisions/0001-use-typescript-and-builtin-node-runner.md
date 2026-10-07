# ADR 0001: Use TypeScript, Node.js ESM, and Built-in Test Runner

## Status

Accepted

## Problem

Brainmap requires a runtime and language ecosystem capable of building cross-platform CLI tools that perform fast, deterministic filesystem scanning, structured JSON handling, and Markdown manipulation across developer environments. The architecture requires minimal dependencies and simple distribution.

## Considered Options

1. **Rust**: High performance and single static binary, but higher compilation overhead and slower prototyping for AST/Markdown transformations.
2. **Go**: Excellent CLI tooling and concurrency, but less pervasive scriptability in general AI tooling ecosystems.
3. **Python**: Highly portable, but package distribution across diverse virtual environments introduces dependency management friction.
4. **TypeScript on Node.js (ESM)**: Native cross-platform execution, ubiquitous developer tooling, strong typing, zero runtime dependencies, and built-in test runner (`node:test`).

## Decision

We chose **TypeScript with Node.js ESM** as the implementation language and runtime, using the built-in **`node:test`** and **`node:assert`** modules for automated testing.

## Rationale

- **Zero Runtime Dependencies**: The core CLI functions without installing external libraries.
- **Built-in Testing**: Node.js 20+ includes a native test runner, removing the need for external testing frameworks like Jest or Vitest.
- **Portability**: Runs uniformly across Windows, macOS, and Linux.
- **Deterministic and Fast**: Excellent I/O primitives for scanning directories and processing metadata.

## Consequences

- Requires Node.js >= 20 to run the test suite and execution scripts.
- Source code requires compilation with `tsc` prior to execution.
