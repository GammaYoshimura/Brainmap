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
M147: Read current milestone.

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
- Context Selection block (M133–M144).
- Handoff block:
  - M145: Created `handoff` command handler (`src/commands/handoff.ts`), wired command dispatch and help description in CLI entry point (`src/cli.ts`).
  - M146: Implemented state reader (`src/handoff/state-reader.ts`) to parse and structure operational state from `.brain/state.md`.
  - M147: Implemented milestone reader (`src/handoff/milestone-reader.ts`) extracting active milestone codes and titles.

### IN PROGRESS
- Handoff block (M145–M158).

### CHANGED FILES
- `src/handoff/milestone-reader.ts`
- `tests/handoff.test.ts`
- `.brain/state.md`
- `.brain/handoff.md`

### TEST STATUS
- 167/167 tests passing (`npm test`).
- TypeScript builds cleanly (`npm run build`).

### OPEN ISSUES
- None.

### IMPORTANT DECISIONS
- The milestone reader parses milestone code and title with regex patterns supporting markdown markers and falls back gracefully to raw content.

### NEXT ACTION
- Proceed to M148: Detect recent changes.

### CONTEXT TO LOAD
- `.brain/index.md`
- `.brain/state.md`
- `.brain/handoff.md`
- `src/handoff/milestone-reader.ts`
