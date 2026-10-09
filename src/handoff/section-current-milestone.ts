import { readCurrentMilestone } from "./milestone-reader.js";

export function generateCurrentMilestoneSection(targetDir: string): string {
  const milestone = readCurrentMilestone(targetDir);
  if (!milestone) {
    return "### CURRENT MILESTONE\nUnknown.\n";
  }

  if (milestone.code && milestone.title) {
    return `### CURRENT MILESTONE\n${milestone.code}: ${milestone.title}\n`;
  }

  return `### CURRENT MILESTONE\n${milestone.raw}\n`;
}
