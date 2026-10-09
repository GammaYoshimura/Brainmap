#!/usr/bin/env node

import { initCommand } from "./commands/init.js";
import { scanCommand } from "./commands/scan.js";
import { updateCommand } from "./commands/update.js";
import { mapCommand } from "./commands/map.js";
import { routeCommand } from "./commands/route.js";
import { contextCommand } from "./commands/context.js";
import { handoffCommand } from "./commands/handoff.js";

export const HELP_TEXT = `Brainmap - Project memory and context-routing tool

Usage:
  brainmap [command] [options]

Commands:
  init           Initialize Brain structure in current project
  scan           Scan project files and structure
  update         Incrementally update project state and memory
  map            Generate comprehensive project map
  route          Route task query to relevant files and context
  context        Select relevant task context for AI workflows
  handoff        Generate session-to-session continuation handoff

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

  const command = args[0];

  if (command === "init") {
    return initCommand(args.slice(1));
  }

  if (command === "scan") {
    return scanCommand(args.slice(1));
  }

  if (command === "update") {
    return updateCommand(args.slice(1));
  }

  if (command === "map") {
    return mapCommand(args.slice(1));
  }

  if (command === "route") {
    return routeCommand(args.slice(1));
  }

  if (command === "context") {
    return contextCommand(args.slice(1));
  }

  if (command === "handoff") {
    return handoffCommand(args.slice(1));
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
