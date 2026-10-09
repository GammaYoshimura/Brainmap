import { readCurrentState } from "./state-reader.js";

export function generateNextActionSection(targetDir: string): string {
  const state = readCurrentState(targetDir);
  if (state?.immediateNextWorkRaw) {
    const raw = state.immediateNextWorkRaw.trim();
    const formatted = raw.startsWith("-") || raw.startsWith("*")
      ? raw
      : `- ${raw}`;
    return `### NEXT ACTION\n${formatted}\n`;
  }

  return "### NEXT ACTION\n- Continue with the next project milestone.\n";
}
