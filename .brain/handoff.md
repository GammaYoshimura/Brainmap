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
M126: Return relevant Brain documents.

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
- Routing block:
  - M118: Created `route` command handler (`src/commands/route.ts`), wired command dispatch and help description in CLI entry point (`src/cli.ts`).
  - M119: Implemented natural-language task query parsing, normalization, tokenization, and CLI argument integration (`src/router/query.ts`, `src/commands/route.ts`, `tests/route-query.test.ts`).
  - M120: Implemented exact path matching resolver against project and brain files (`src/router/path-matcher.ts`, `tests/route-path-matcher.test.ts`).
  - M121: Implemented file name and stem matching resolver against candidate paths (`src/router/filename-matcher.ts`, `tests/route-filename-matcher.test.ts`).
  - M122: Implemented subsystem matching resolver with identifier, name, path, and token heuristics (`src/router/subsystem-matcher.ts`, `tests/route-subsystem-matcher.test.ts`).
  - M123: Implemented Brain document matching resolver with role-intent keywords, exact paths, and subsystem mappings (`src/router/brain-doc-matcher.ts`, `tests/route-brain-doc-matcher.test.ts`).
  - M124: Implemented exported symbol extraction and symbol-matching resolver with exact and case-insensitive scoring (`src/router/symbol-matcher.ts`, `tests/route-symbol-matcher.test.ts`).
  - M125: Implemented relevance ranking engine with score aggregation, reason tracking, and category weighting (`src/router/ranking.ts`, `tests/route-ranking.test.ts`).
  - M126: Implemented relevant Brain document router (`src/router/brain-doc-router.ts`, `tests/route-brain-doc-router.test.ts`).

### IN PROGRESS
- Completing M126: Return relevant Brain documents.

### CHANGED FILES
- `src/router/brain-doc-router.ts`
- `src/router/ranking.ts`
- `src/router/index.ts`
- `tests/route-brain-doc-router.test.ts`
- `.brain/project-map.md`
- `.brain/state.md`
- `.brain/handoff.md`

### TEST STATUS
- 129/129 tests passing (`npm test`).
- TypeScript builds cleanly (`npm run build`).

### OPEN ISSUES
- None.

### IMPORTANT DECISIONS
- Discovering Brain documents recursively reads all `.md` documents under `.brain/` (root, decisions, subsystems), scores them with role-intent, path, and filename matchers, and ranks results.

### NEXT ACTION
- Implement M127: Return relevant source files.

### CONTEXT TO LOAD
- `.brain/index.md`
- `.brain/state.md`
- `.brain/handoff.md`
- `src/router/query.ts`
- `src/router/brain-doc-router.ts`
