import path from "node:path";

export const EXTENSION_TO_LANGUAGE_MAP: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".dart": "Dart",
  ".py": "Python",
  ".php": "PHP",
  ".rs": "Rust",
  ".go": "Go",
  ".cs": "C#",
  ".cpp": "C++",
  ".cc": "C++",
  ".cxx": "C++",
  ".hpp": "C++",
  ".c": "C",
  ".h": "C",
  ".java": "Java",
  ".kt": "Kotlin",
  ".kts": "Kotlin",
  ".swift": "Swift",
  ".rb": "Ruby",
  ".md": "Markdown",
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".toml": "TOML",
  ".html": "HTML",
  ".htm": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".less": "Less",
  ".sql": "SQL",
  ".sh": "Shell",
  ".bash": "Shell",
  ".ps1": "PowerShell",
};

export function detectLanguageByExtension(extensionOrPath: string): string | undefined {
  const ext = extensionOrPath.startsWith(".")
    ? extensionOrPath.toLowerCase()
    : path.extname(extensionOrPath).toLowerCase();
  return EXTENSION_TO_LANGUAGE_MAP[ext];
}

export interface LanguageSummary {
  name: string;
  fileCount: number;
  percentage: number;
}

export function detectProjectLanguages(files: { language?: string }[]): LanguageSummary[] {
  const counts: Record<string, number> = {};
  let totalWithLanguage = 0;

  for (const file of files) {
    if (file.language) {
      counts[file.language] = (counts[file.language] ?? 0) + 1;
      totalWithLanguage++;
    }
  }

  return Object.entries(counts)
    .map(([name, fileCount]) => ({
      name,
      fileCount,
      percentage: totalWithLanguage > 0 ? Math.round((fileCount / totalWithLanguage) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.fileCount - a.fileCount || a.name.localeCompare(b.name));
}
