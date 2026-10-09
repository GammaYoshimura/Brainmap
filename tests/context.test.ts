import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskQuery } from "../src/router/query.js";
import { createContextInput } from "../src/context/context-selector.js";
import { selectRelevantBrainDocuments } from "../src/context/brain-doc-selector.js";
import { selectRelevantSourceCode } from "../src/context/source-code-selector.js";
import { filterByRelevance, DEFAULT_MIN_RELEVANCE_SCORE } from "../src/context/relevance-filter.js";
import {
  createContextBudget,
  canIncludeInBudget,
  recordInBudget,
  truncateContentToLimit,
} from "../src/context/context-limits.js";
import { prioritizeContextItems } from "../src/context/prioritizer.js";
import { formatContextText, formatContextJson, ContextPayload } from "../src/context/formatter.js";
import { assembleContext } from "../src/context/context-selector.js";

test("createContextInput uses routing results as input", () => {
  const query = parseTaskQuery("Refactor query parser and check test runner");
  assert.notEqual(query, null);

  const contextInput = createContextInput(process.cwd(), query!);
  assert.equal(contextInput.projectRoot, process.cwd());
  assert.equal(contextInput.routeResult.query, "Refactor query parser and check test runner");
  assert.ok(Array.isArray(contextInput.routeResult.brainDocs));
  assert.ok(Array.isArray(contextInput.routeResult.sourceFiles));
  assert.ok(Array.isArray(contextInput.routeResult.tests));
});

test("selectRelevantBrainDocuments selects and loads brain documents", () => {
  const query = parseTaskQuery("architecture and state decisions");
  assert.notEqual(query, null);

  const contextInput = createContextInput(process.cwd(), query!);
  const docs = selectRelevantBrainDocuments(contextInput);

  assert.ok(docs.length > 0);
  assert.ok(docs[0].score > 0);
  assert.ok(docs[0].path.startsWith(".brain"));
  assert.ok(typeof docs[0].content === "string");
  assert.ok(docs[0].sizeBytes > 0);
});

test("selectRelevantSourceCode selects and loads source and test files", () => {
  const query = parseTaskQuery("cli entry point and test runner");
  assert.notEqual(query, null);

  const contextInput = createContextInput(process.cwd(), query!);
  const codeFiles = selectRelevantSourceCode(contextInput);

  assert.ok(codeFiles.length > 0);
  assert.ok(codeFiles[0].score > 0);
  assert.ok(typeof codeFiles[0].content === "string");
  assert.ok(codeFiles[0].sizeBytes > 0);
  assert.ok(typeof codeFiles[0].isTest === "boolean");
});

test("filterByRelevance and minRelevanceScore exclude low-relevance files", () => {
  const items = [
    { path: "high.ts", score: 80 },
    { path: "medium.ts", score: 45 },
    { path: "low.ts", score: 15 },
  ];

  const filtered = filterByRelevance(items, DEFAULT_MIN_RELEVANCE_SCORE);
  assert.equal(filtered.length, 2);
  assert.deepEqual(filtered.map((i) => i.path), ["high.ts", "medium.ts"]);

  const strictFiltered = filterByRelevance(items, 60);
  assert.equal(strictFiltered.length, 1);
  assert.equal(strictFiltered[0].path, "high.ts");
});

test("createContextBudget and canIncludeInBudget enforce size and file limits", () => {
  const budget = createContextBudget(100, 2);
  assert.equal(budget.currentCharacters, 0);
  assert.equal(budget.currentFiles, 0);

  assert.equal(canIncludeInBudget(budget, 50), true);
  recordInBudget(budget, 50);
  assert.equal(budget.currentCharacters, 50);
  assert.equal(budget.currentFiles, 1);

  assert.equal(canIncludeInBudget(budget, 60), false); // Exceeds 100
  assert.equal(canIncludeInBudget(budget, 30), true);
  recordInBudget(budget, 30);
  assert.equal(budget.currentFiles, 2);

  assert.equal(canIncludeInBudget(budget, 10), false); // Max files reached

  const truncated = truncateContentToLimit("Hello world, this is a long text", 10);
  assert.equal(truncated.truncated, true);
  assert.match(truncated.content, /Hello worl/);
});

test("prioritizeContextItems sorts by score, type, and fits within budget", () => {
  const docs = [
    {
      path: ".brain/architecture.md",
      score: 70,
      reasons: ["matches intent"],
      content: "# Architecture Constitution",
      sizeBytes: 28,
    },
  ];

  const sourceFiles = [
    {
      path: "src/cli.ts",
      score: 90,
      reasons: ["exact match"],
      content: "export function run() {}",
      sizeBytes: 25,
      isTest: false,
    },
    {
      path: "tests/cli.test.ts",
      score: 70,
      reasons: ["test match"],
      content: "test('cli', () => {})",
      sizeBytes: 22,
      isTest: true,
    },
  ];

  const budget = createContextBudget(100, 2);
  const { items, omittedCount } = prioritizeContextItems(docs, sourceFiles, budget);

  assert.equal(items.length, 2);
  assert.equal(items[0].path, "src/cli.ts"); // score 90
  assert.equal(items[1].path, ".brain/architecture.md"); // score 70 (brain-doc before test on tie)
  assert.equal(omittedCount, 1);
});

test("formatContextText creates plain-text context output", () => {
  const payload: ContextPayload = {
    query: "Implement context output",
    projectRoot: "/mock/root",
    items: [
      {
        type: "brain-doc",
        path: ".brain/index.md",
        score: 80,
        reasons: ["matches router"],
        content: "# Brain Index",
        truncated: false,
        characters: 13,
      },
    ],
    omittedCount: 0,
    totalCharacters: 13,
  };

  const text = formatContextText(payload);
  assert.match(text, /=== Brainmap Context for: "Implement context output" ===/);
  assert.match(text, /Project: \/mock\/root/);
  assert.match(text, /--- \[BRAIN DOC\] \.brain\/index\.md \(score: 80\) ---/);
  assert.match(text, /# Brain Index/);
  assert.match(text, /=== End of Context ===/);
});

test("formatContextJson creates valid parseable JSON output", () => {
  const payload: ContextPayload = {
    query: "JSON context test",
    projectRoot: "/mock/root",
    items: [],
    omittedCount: 0,
    totalCharacters: 0,
  };

  const jsonStr = formatContextJson(payload);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.query, "JSON context test");
  assert.equal(parsed.projectRoot, "/mock/root");
  assert.deepEqual(parsed.items, []);
});

test("assembleContext builds complete context payload from input", () => {
  const query = parseTaskQuery("architecture routing and cli");
  assert.notEqual(query, null);

  const contextInput = createContextInput(process.cwd(), query!);
  const payload = assembleContext(contextInput);

  assert.equal(payload.query, "architecture routing and cli");
  assert.ok(Array.isArray(payload.items));
  assert.ok(payload.items.length > 0);
  assert.ok(payload.totalCharacters > 0);
});
