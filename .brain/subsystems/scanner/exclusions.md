# Scanner Exclusion Behavior

Specifies how Brainmap filters directories and files during project scans.

## Exclusion Precedence

1. **VCS Internal Directories**: `.git/` is always excluded by default to avoid scanning git internals and packfiles.
2. **Standard Dependency Directories**: Common package manager caches and dependencies are excluded:
   - `node_modules` (Node.js/npm/yarn/pnpm)
   - `vendor` (PHP Composer / Go)
   - `.pub-cache` (Dart/Flutter)
   - `Pods` (iOS CocoaPods)
   - `.venv`, `venv`, `env` (Python virtual environments)
3. **Common Build and Output Directories**: Compilation artifacts and generated files are excluded:
   - `dist`, `build`, `out`, `target`, `bin`, `obj`, `.dart_tool`, `coverage`
4. **Gitignore Rules**:
   - When `.gitignore` is present in the project root and `useGitignore` is enabled, patterns are parsed and evaluated.
   - Anchored paths, wildcards (`*`, `**`), directory-only markers (`/`), and negation rules (`!`) are respected.
5. **Custom Exclusions**:
   - Custom directory names (`ignoredDirectories`)
   - Custom glob/gitignore patterns (`customPatterns`)
