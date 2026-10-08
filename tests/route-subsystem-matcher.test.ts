import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskQuery } from "../src/router/query.js";
import { resolveSubsystemMatches, SubsystemCandidate } from "../src/router/subsystem-matcher.js";

const sampleSubsystems: SubsystemCandidate[] = [
  {
    id: "scanner",
    name: "Scanner Subsystem",
    path: "src/scanner",
    docPath: ".brain/subsystems/scanner/index.md",
  },
  {
    id: "mapper",
    name: "Mapper Subsystem",
    path: "src/mapper",
    docPath: ".brain/subsystems/mapper/index.md",
  },
  {
    id: "core",
    name: "Core Domain Subsystem",
    path: "src/core",
    docPath: ".brain/subsystems/core/index.md",
  },
  {
    id: "auth",
    name: "Authentication Subsystem",
    path: "src/auth",
    docPath: ".brain/subsystems/auth/index.md",
  },
];

test("resolveSubsystemMatches matches by subsystem id token", () => {
  const query = parseTaskQuery("Improve the scanner performance on huge repos");
  assert.notEqual(query, null);

  const matches = resolveSubsystemMatches(sampleSubsystems, query!);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].subsystem.id, "scanner");
  assert.equal(matches[0].matchedBy, "id");
  assert.equal(matches[0].score, 100);
});

test("resolveSubsystemMatches matches by subsystem name in query", () => {
  const query = parseTaskQuery("Verify Core Domain Subsystem invariants");
  assert.notEqual(query, null);

  const matches = resolveSubsystemMatches(sampleSubsystems, query!);
  assert.ok(matches.length >= 1);
  assert.equal(matches[0].subsystem.id, "core");
  assert.equal(matches[0].matchedBy, "id"); // "core" is also a token
});

test("resolveSubsystemMatches matches by path segments", () => {
  const query = parseTaskQuery("Audit all code located in src/mapper");
  assert.notEqual(query, null);

  const matches = resolveSubsystemMatches(sampleSubsystems, query!);
  assert.ok(matches.length >= 1);
  assert.equal(matches[0].subsystem.id, "mapper");
});

test("resolveSubsystemMatches matches partial token (e.g., authentication matches auth)", () => {
  const query = parseTaskQuery("Add refresh-token support to authentication");
  assert.notEqual(query, null);

  const matches = resolveSubsystemMatches(sampleSubsystems, query!);
  assert.ok(matches.length >= 1);
  assert.equal(matches[0].subsystem.id, "auth");
  assert.equal(matches[0].matchedBy, "token");
});

test("resolveSubsystemMatches returns empty array when no subsystems match", () => {
  const query = parseTaskQuery("Add telemetry logging to cloud billing service");
  assert.notEqual(query, null);

  const matches = resolveSubsystemMatches(sampleSubsystems, query!);
  assert.deepEqual(matches, []);
});

test("resolveSubsystemMatches handles empty candidate list gracefully", () => {
  const query = parseTaskQuery("Check scanner");
  const matches = resolveSubsystemMatches([], query!);
  assert.deepEqual(matches, []);
});
