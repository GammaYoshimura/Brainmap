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
M023: Document the handoff format.

### COMPLETED
- Repository foundation (M001–M010).
- Brain structure and root documents (M011–M022).
- ADR 0001 and ADR format documentation.

### IN PROGRESS
- Completing M023.

### CHANGED FILES
- `.brain/handoff.md`

### TEST STATUS
- 3/3 tests passing (`npm test`).
- TypeScript builds cleanly (`npm run build`).

### OPEN ISSUES
- None.

### IMPORTANT DECISIONS
- ADR 0001: Pure TypeScript + Node.js ESM + native `node:test` runner.

### NEXT ACTION
- Implement M024: Document the routing principles.

### CONTEXT TO LOAD
- `.brain/index.md`
- `.brain/architecture.md`
- `.brain/state.md`
- `.brain/handoff.md`
