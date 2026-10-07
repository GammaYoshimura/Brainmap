#!/usr/bin/env node

export const HELP_TEXT = `Brainmap - Project memory and context-routing tool

Usage:
  brainmap [command] [options]

Options:
  -h, --help     Show this help message
`;

export const EXIT_SUCCESS = 0;
export const EXIT_FAILURE = 1;

export function run(args: string[] = process.argv.slice(2)): number {
  if (args.includes("--help") || args.includes("-h") || args[0] === "help") {
    console.log(HELP_TEXT.trim());
    return EXIT_SUCCESS;
  }

  if (args.length > 0 && args[0].startsWith("-")) {
    console.error(`Unknown option: ${args[0]}`);
    return EXIT_FAILURE;
  }

  console.log("Brainmap");
  return EXIT_SUCCESS;
}

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith("cli.ts") ||
  process.argv[1].endsWith("cli.js")
);

if (isDirectRun) {
  process.exitCode = run();
}
