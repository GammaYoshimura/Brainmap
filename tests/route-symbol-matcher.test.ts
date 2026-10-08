import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskQuery } from "../src/router/query.js";
import {
  extractSymbolsFromContent,
  resolveSymbolMatches,
  SymbolDeclaration,
} from "../src/router/symbol-matcher.js";

test("extractSymbolsFromContent extracts TypeScript export declarations", () => {
  const code = `
    export interface TaskQuery { raw: string; }
    export const DEFAULT_TIMEOUT = 1000;
    export function parseTaskQuery(query: string): TaskQuery { return { raw: query }; }
    export class RouterService {}
  `;
  const decls = extractSymbolsFromContent(code, "src/router/query.ts");
  const names = decls.map((d) => d.symbol);

  assert.ok(names.includes("TaskQuery"));
  assert.ok(names.includes("DEFAULT_TIMEOUT"));
  assert.ok(names.includes("parseTaskQuery"));
  assert.ok(names.includes("RouterService"));
});

test("resolveSymbolMatches matches exact case-sensitive symbol", () => {
  const query = parseTaskQuery("Refactor parseTaskQuery to support multiple options");
  assert.notEqual(query, null);

  const decls: SymbolDeclaration[] = [
    { path: "src/router/query.ts", symbol: "parseTaskQuery" },
    { path: "src/cli.ts", symbol: "run" },
  ];

  const matches = resolveSymbolMatches(decls, query!);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].symbol, "parseTaskQuery");
  assert.equal(matches[0].path, "src/router/query.ts");
  assert.equal(matches[0].score, 100);
});

test("resolveSymbolMatches matches case-insensitive symbol", () => {
  const query = parseTaskQuery("Update taskquery definition");
  assert.notEqual(query, null);

  const decls: SymbolDeclaration[] = [
    { path: "src/router/query.ts", symbol: "TaskQuery" },
  ];

  const matches = resolveSymbolMatches(decls, query!);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].symbol, "TaskQuery");
  assert.equal(matches[0].score, 85);
});

test("resolveSymbolMatches returns empty array when no symbols match", () => {
  const query = parseTaskQuery("Fix database connection string");
  assert.notEqual(query, null);

  const decls: SymbolDeclaration[] = [
    { path: "src/router/query.ts", symbol: "parseTaskQuery" },
  ];

  const matches = resolveSymbolMatches(decls, query!);
  assert.deepEqual(matches, []);
});
