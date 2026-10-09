import fs from "node:fs";
import path from "node:path";
import { readCurrentState } from "./state-reader.js";

export interface TestStatusSummary {
  status: "passing" | "failing" | "unknown";
  rawDescription?: string;
  testCount?: number;
  failingCount?: number;
}

export function readAvailableTestStatus(targetDir: string): TestStatusSummary {
  const handoffPath = path.join(targetDir, ".brain", "handoff.md");
  if (fs.existsSync(handoffPath)) {
    const handoffRaw = fs.readFileSync(handoffPath, "utf8");
    const testMatch = handoffRaw.match(/### TEST STATUS\s*\r?\n([\s\S]*?)(?=\r?\n### |\n## |$)/i);
    if (testMatch && testMatch[1].trim()) {
      const rawDescription = testMatch[1].trim();
      const passMatch = rawDescription.match(/(\d+)\/(\d+)\s+tests\s+passing/i);
      const testCount = passMatch ? parseInt(passMatch[2], 10) : undefined;
      const failingCount = (passMatch && parseInt(passMatch[1], 10) < parseInt(passMatch[2], 10))
        ? parseInt(passMatch[2], 10) - parseInt(passMatch[1], 10)
        : 0;

      return {
        status: failingCount > 0 ? "failing" : "passing",
        rawDescription,
        testCount,
        failingCount,
      };
    }
  }

  const state = readCurrentState(targetDir);
  if (state?.currentConditionsRaw) {
    const rawDescription = state.currentConditionsRaw;
    const isPassing = /passing/i.test(rawDescription);
    const isFailing = /failing|failed/i.test(rawDescription);
    const countMatch = rawDescription.match(/(\d+)\s+passing\s+tests/i);
    const testCount = countMatch ? parseInt(countMatch[1], 10) : undefined;

    return {
      status: isFailing ? "failing" : isPassing ? "passing" : "unknown",
      rawDescription,
      testCount,
      failingCount: isFailing ? 1 : 0,
    };
  }

  return {
    status: "unknown",
  };
}
