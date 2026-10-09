import fs from "node:fs";
import path from "node:path";

export interface StateContent {
  raw: string;
  currentMilestoneRaw?: string;
  implementedRaw?: string;
  inProgressRaw?: string;
  knownBlockersRaw?: string;
  currentConditionsRaw?: string;
  immediateNextWorkRaw?: string;
}

export function readCurrentState(targetDir: string): StateContent | null {
  const statePath = path.join(targetDir, ".brain", "state.md");
  if (!fs.existsSync(statePath)) {
    return null;
  }

  const raw = fs.readFileSync(statePath, "utf8");

  const extractSection = (headingRegex: RegExp, nextHeadingRegex: RegExp): string | undefined => {
    const match = raw.match(headingRegex);
    if (!match || match.index === undefined) return undefined;
    const startIndex = match.index + match[0].length;
    const remainder = raw.slice(startIndex);
    const nextMatch = remainder.match(nextHeadingRegex);
    const sectionText = nextMatch && nextMatch.index !== undefined
      ? remainder.slice(0, nextMatch.index)
      : remainder;
    return sectionText.trim();
  };

  const currentMilestoneRaw = extractSection(/## Current Milestone\s*/i, /\n## /i);
  const implementedRaw = extractSection(/## What is Implemented\s*/i, /\n## /i);
  const inProgressRaw = extractSection(/## What is In Progress\s*/i, /\n## /i);
  const knownBlockersRaw = extractSection(/## Known Blockers\s*/i, /\n## /i);
  const currentConditionsRaw = extractSection(/## Relevant Current Conditions\s*/i, /\n## /i);
  const immediateNextWorkRaw = extractSection(/## Immediate Next Work\s*/i, /\n## /i);

  return {
    raw,
    currentMilestoneRaw,
    implementedRaw,
    inProgressRaw,
    knownBlockersRaw,
    currentConditionsRaw,
    immediateNextWorkRaw,
  };
}
