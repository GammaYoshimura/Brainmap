# Architectural Decision Records (ADRs)

This directory records architecturally significant decisions made during the design and development of Brainmap.

## ADR File Naming Convention

ADR files follow the format:
```text
NNNN-slug-title.md
```
Where `NNNN` is a zero-padded 4-digit sequential integer (e.g., `0001-use-typescript-and-builtin-node-runner.md`).

## Standard ADR Format

Every ADR must include the following sections:

1. **Title**: Heading 1 (`# ADR NNNN: Title`)
2. **Status**: Heading 2 (`## Status`) — Valid values: `Proposed`, `Accepted`, `Superseded`, `Deprecated`.
3. **Problem**: Heading 2 (`## Problem`) — Context, requirements, and challenges being addressed.
4. **Considered Options**: Heading 2 (`## Considered Options`) — Alternatives evaluated.
5. **Decision**: Heading 2 (`## Decision`) — The chosen option.
6. **Rationale**: Heading 2 (`## Rationale`) — Key reasons supporting the decision over the alternatives.
7. **Consequences**: Heading 2 (`## Consequences`) — Resulting trade-offs, positive benefits, and constraints.

## Decision Index

- **[0001-use-typescript-and-builtin-node-runner.md](0001-use-typescript-and-builtin-node-runner.md)**: Use TypeScript, Node.js ESM, and Built-in Test Runner.
