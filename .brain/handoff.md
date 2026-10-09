# Handoff

Session-to-session continuation document for Brainmap.

## Format Specification

The handoff document ensures that any subsequent AI agent or developer session can resume work immediately without loading the entire repository history. It must remain concise and action-oriented rather than an append-only diary.

### Standard Sections

- **CURRENT MILESTONE**: Active milestone code and summary.
- **COMPLETED**: Recently finished milestones or deliverables.
- **IN PROGRESS**: Current ongoing task or implementation state.
- **CHANGED FILES**: Exact list of files created or modified in the current work slice.
- **TEST STATUS**: State of the automated test suite and execution results.
- **OPEN ISSUES**: Current blockers, bugs, or unaddressed edge cases.
- **IMPORTANT DECISIONS**: Key architectural choices or constraints affecting current work.
- **NEXT ACTION**: The immediate next step to take.
- **CONTEXT TO LOAD**: Minimal specific files to read when beginning the next session.

---

## Current Operational Handoff

### CURRENT MILESTONE
M144: Add context-selection tests.

### COMPLETED
- Repository foundation (M001–M010).
- Brain structure and root documents (M011–M025).
- Internal project model & serialization (M026–M035).
- `brainmap init` command (M036–M052).
- Ignore rules & scan exclusions (M053–M061).
- `brainmap scan` command (M062–M073).
- `brainmap update` command (M074–M085).
- Project Structure Detection (M086–M096).
- `brainmap map` block (M097–M108).
- Specialized Documentation block (M109–M117).
- Routing block (M118–M132).
- Context Selection block (M133–M144) complete:
  - M133: Created `context` command handler (`src/commands/context.ts`), wired command dispatch and help description in CLI entry point (`src/cli.ts`).
  - M134: Implemented task query acceptance, validation, and error reporting for `brainmap context` (`src/commands/context.ts`, `tests/cli.test.ts`).
  - M135: Connected routing output to context input via `createContextInput` (`src/context/context-selector.ts`, `tests/context.test.ts`).
  - M136: Implemented Brain document context selection and reading (`src/context/brain-doc-selector.ts`, `tests/context.test.ts`).
  - M137: Implemented source code and test file selection (`src/context/source-code-selector.ts`, `tests/context.test.ts`).
  - M138: Implemented low-relevance file exclusion (`src/context/relevance-filter.ts`, `tests/context.test.ts`).
  - M139: Implemented configurable context-size limits and budget controls (`src/context/context-limits.ts`, `tests/context.test.ts`).
  - M140: Implemented relevance-based prioritization and budget-aware assembly (`src/context/prioritizer.ts`, `tests/context.test.ts`).
  - M141: Implemented plain-text context formatting (`src/context/formatter.ts`, `tests/context.test.ts`).
  - M142: Implemented JSON context serialization and CLI `--json` flag integration (`src/context/formatter.ts`, `src/commands/context.ts`, `tests/context.test.ts`).
  - M143: Implemented concise context summary generation and formatting with CLI `--summary` flag (`src/context/formatter.ts`, `src/commands/context.ts`, `tests/context.test.ts`).
  - M144: Added end-to-end context-selection test suite with multi-tier fixture verification and CLI execution (`tests/context-e2e.test.ts`).

### IN PROGRESS
- Concluding Context Selection block (M133–M144).

### CHANGED FILES
- `tests/context-e2e.test.ts`
- `.brain/project-map.md`
- `.brain/state.md`
- `.brain/handoff.md`

### TEST STATUS
- 162/162 tests passing (`npm test`).
- TypeScript builds cleanly (`npm run build`).

### OPEN ISSUES
- None.

### IMPORTANT DECISIONS
- The entire context selection pipeline is deterministic, respects token and character budgets, prioritizes architectural constitution documents, and outputs plain text or structured JSON.

### NEXT ACTION
- Proceed to next block: **Handoff** (M145: Create `brainmap handoff`).

### CONTEXT TO LOAD
- `.brain/index.md`
- `.brain/state.md`
- `.brain/handoff.md`
- `src/context/context-selector.ts`
- `src/commands/context.ts`
