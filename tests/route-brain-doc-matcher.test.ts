import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskQuery } from "../src/router/query.js";
import { resolveBrainDocMatches, BrainDocCandidate } from "../src/router/brain-doc-matcher.js";

const sampleBrainDocs: BrainDocCandidate[] = [
  {
    path: "/repo/.brain/index.md",
    relativePath: ".brain/index.md",
    title: "Brain Index",
    role: "router",
  },
  {
    path: "/repo/.brain/architecture.md",
    relativePath: ".brain/architecture.md",
    title: "Architecture Constitution",
    role: "constitution",
  },
  {
    path: "/repo/.brain/state.md",
    relativePath: ".brain/state.md",
    title: "Project State",
    role: "state",
  },
  {
    path: "/repo/.brain/handoff.md",
    relativePath: ".brain/handoff.md",
    title: "Session Handoff",
    role: "handoff",
  },
  {
    path: "/repo/.brain/project-map.md",
    relativePath: ".brain/project-map.md",
    title: "Project Map",
    role: "specialized",
  },
  {
    path: "/repo/.brain/decisions/0001-implementation-stack.md",
    relativePath: ".brain/decisions/0001-implementation-stack.md",
    title: "ADR 0001: Implementation Stack",
    role: "decision",
  },
  {
    path: "/repo/.brain/subsystems/scanner/index.md",
    relativePath: ".brain/subsystems/scanner/index.md",
    title: "Scanner Subsystem",
    role: "subsystem",
  },
];

test("resolveBrainDocMatches matches by exact filename or path", () => {
  const query = parseTaskQuery("Please review .brain/architecture.md carefully");
  assert.notEqual(query, null);

  const matches = resolveBrainDocMatches(sampleBrainDocs, query!);
  assert.ok(matches.length >= 1);
  assert.equal(matches[0].document.relativePath, ".brain/architecture.md");
  assert.equal(matches[0].matchedBy, "exact-path");
  assert.equal(matches[0].score, 100);
});

test("resolveBrainDocMatches matches constitution role by architectural intent", () => {
  const query = parseTaskQuery("What are the architectural invariants and module boundaries?");
  assert.notEqual(query, null);

  const matches = resolveBrainDocMatches(sampleBrainDocs, query!);
  assert.ok(matches.length >= 1);
  const archMatch = matches.find((m) => m.document.relativePath === ".brain/architecture.md");
  assert.notEqual(archMatch, undefined);
  assert.equal(archMatch?.matchedBy, "role-intent");
});

test("resolveBrainDocMatches matches state and handoff documents by intent", () => {
  const query = parseTaskQuery("Check current milestone progress and blockers");
  assert.notEqual(query, null);

  const matches = resolveBrainDocMatches(sampleBrainDocs, query!);
  assert.ok(matches.length >= 1);
  const stateMatch = matches.find((m) => m.document.relativePath === ".brain/state.md");
  assert.notEqual(stateMatch, undefined);
});

test("resolveBrainDocMatches matches ADR by decision keywords", () => {
  const query = parseTaskQuery("Read ADR decision on tech stack rationale");
  assert.notEqual(query, null);

  const matches = resolveBrainDocMatches(sampleBrainDocs, query!);
  assert.ok(matches.length >= 1);
  const adrMatch = matches.find((m) => m.document.relativePath.includes("decisions/"));
  assert.notEqual(adrMatch, undefined);
});

test("resolveBrainDocMatches matches subsystem doc by subsystem name token", () => {
  const query = parseTaskQuery("Inspect the scanner subsystem documentation");
  assert.notEqual(query, null);

  const matches = resolveBrainDocMatches(sampleBrainDocs, query!);
  assert.ok(matches.length >= 1);
  const scannerMatch = matches.find((m) => m.document.relativePath.includes("subsystems/scanner"));
  assert.notEqual(scannerMatch, undefined);
});

test("resolveBrainDocMatches returns empty array when query has no matching documents", () => {
  const query = parseTaskQuery("Deploy kubernetes cluster to aws");
  assert.notEqual(query, null);

  const matches = resolveBrainDocMatches(sampleBrainDocs, query!);
  assert.deepEqual(matches, []);
});

test("resolveBrainDocMatches handles empty doc list gracefully", () => {
  const query = parseTaskQuery("architecture");
  const matches = resolveBrainDocMatches([], query!);
  assert.deepEqual(matches, []);
});
