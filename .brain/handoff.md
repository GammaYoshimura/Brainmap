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
M107: Detect relevant project changes.

### COMPLETED
- Repository foundation (M001–M010).
- Brain structure and root documents (M011–M025).
- Internal project model & serialization (M026–M035).
- `brainmap init` command (M036–M052).
- Ignore rules & scan exclusions (M053–M061).
- `brainmap scan` command (M062–M073).
- `brainmap update` command (M074–M085).
- Project Structure Detection (M086–M096).
- M097: Created `map` command handler and registered CLI entrypoint with help text.
- M098: Created directory-map generation model and formatting (`src/mapper/directory-map.ts`).
- M099: Created file-map generation with directory grouping and size formatting (`src/mapper/file-map.ts`).
- M100: Created module-map generation with container inspection and language aggregation (`src/mapper/module-map.ts`).
- M101: Created entry-point mapping with role categorization and Markdown formatting (`src/mapper/entrypoint-map.ts`).
- M102: Created manifest mapping with package metadata, ecosystem identification, and dependency counting (`src/mapper/manifest-map.ts`).
- M103: Created declared-dependency mapping categorized by production, development, peer, and optional scopes (`src/mapper/dependency-map.ts`).
- M104: Synthesized project map components into `project-map.md` in `.brain/` (`src/mapper/project-map.ts`).
- M105: Added global routing link from `.brain/index.md` and automated routing integration in `ensureProjectMapRoutingInIndex`.
- M106: Supported incremental map updates in `updateProjectMapIncrementally` invoked by `brainmap update`.
- M107: Created change-relevance detector evaluating structural, manifest, entry-point, and module impacts of diffs (`src/mapper/change-detector.ts`).

### IN PROGRESS
- Completing M107.

### CHANGED FILES
- `src/mapper/change-detector.ts`
- `tests/mapper.test.ts`
- `.brain/state.md`
- `.brain/handoff.md`

### TEST STATUS
- 58/58 tests passing (`npm test`).
- TypeScript builds cleanly (`npm run build`).

### OPEN ISSUES
- None.

### IMPORTANT DECISIONS
- Change relevance detection distinguishes between benign content modifications and changes that require structural map refreshes (entrypoints, manifests, directories, modules).

### NEXT ACTION
- Proceed to M108: Add mapper tests.

### CONTEXT TO LOAD
- `brainmap_master_prompt.md`
- `.brain/state.md`
- `.brain/handoff.md`
