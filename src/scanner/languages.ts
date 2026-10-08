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
