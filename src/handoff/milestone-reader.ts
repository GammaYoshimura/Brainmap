import { readCurrentState } from "./state-reader.js";

export interface MilestoneInfo {
  code?: string;
  title?: string;
  raw: string;
}

export function readCurrentMilestone(targetDir: string): MilestoneInfo | null {
  const state = readCurrentState(targetDir);
  if (!state || !state.currentMilestoneRaw) {
    return null;
  }

  const raw = state.currentMilestoneRaw.trim();
  const match = raw.match(/\*{0,2}(M\d+)\*{0,2}[:\s-]+(.*)/i);

  if (match) {
    const code = match[1].toUpperCase();
    const title = match[2].trim().replace(/^\*+|\*+$/g, "").trim();
    return {
      code,
      title,
      raw,
    };
  }

  return {
    raw,
  };
}
