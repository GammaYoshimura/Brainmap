export interface ExclusionConfig {
  useGitignore: boolean;
  excludeGit: boolean;
  ignoredDirectories: string[];
  customPatterns: string[];
}

export function createDefaultExclusionConfig(): ExclusionConfig {
  return {
    useGitignore: true,
    excludeGit: true,
    ignoredDirectories: [],
    customPatterns: [],
  };
}
