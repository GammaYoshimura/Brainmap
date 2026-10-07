#!/usr/bin/env node

export const HELP_TEXT = `Brainmap - Project memory and context-routing tool

Usage:
  brainmap [command] [options]

Options:
  -h, --help     Show this help message
`;

export function run(args: string[] = process.argv.slice(2)): void {
  if (args.includes("--help") || args.includes("-h") || args[0] === "help") {
    console.log(HELP_TEXT.trim());
    return;
  }

  console.log("Brainmap");
}

run();
