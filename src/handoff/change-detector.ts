import child_process from "node:child_process";

export interface RecentChangeSummary {
  hasGit: boolean;
  commitHash?: string;
  commitMessage?: string;
  author?: string;
  date?: string;
  recentCommits: Array<{ hash: string; message: string }>;
}

export function detectRecentChanges(targetDir: string, limit: number = 5): RecentChangeSummary {
  try {
    const logOutput = child_process
      .execSync(`git log -n ${limit} --oneline`, {
        cwd: targetDir,
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8",
      })
      .trim();

    if (!logOutput) {
      return {
        hasGit: true,
        recentCommits: [],
      };
    }

    const lines = logOutput.split(/\r?\n/).filter(Boolean);
    const recentCommits = lines.map((line) => {
      const parts = line.split(" ");
      const hash = parts[0];
      const message = parts.slice(1).join(" ");
      return { hash, message };
    });

    const latest = recentCommits[0];

    return {
      hasGit: true,
      commitHash: latest?.hash,
      commitMessage: latest?.message,
      recentCommits,
    };
  } catch {
    return {
      hasGit: false,
      recentCommits: [],
    };
  }
}
