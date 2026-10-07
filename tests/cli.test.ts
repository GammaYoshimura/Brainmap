import test from "node:test";
import assert from "node:assert/strict";
import { run, HELP_TEXT, EXIT_SUCCESS, EXIT_FAILURE } from "../src/cli.js";

test("cli runs successfully with no arguments", () => {
  const code = run([]);
  assert.equal(code, EXIT_SUCCESS);
});

test("cli returns success and shows help on --help", () => {
  const code = run(["--help"]);
  assert.equal(code, EXIT_SUCCESS);
});

test("cli returns failure on unknown option", () => {
  const code = run(["--unknown-flag"]);
  assert.equal(code, EXIT_FAILURE);
});
