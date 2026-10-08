import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseTaskQuery } from "../src/router/query.js";
import {
  parseAdrContent,
  discoverAdrs,
  routeRelevantAdrs,
} from "../src/router/adr-router.js";

test("parseAdrContent extracts ID, title, and status", () => {
  const content = `# ADR 0001: Implementation Stack Selection

Status: Accepted

## Context
We need to pick Node.js with TypeScript and ESM.
`;
  const record = parseAdrContent(content, "/fake/0001-stack.md", "/fake");
  assert.equal(record.id, "0001");
  assert.equal(record.title, "ADR 0001: Implementation Stack Selection");
  assert.equal(record.status, "Accepted");
});

test("discoverAdrs reads and sorts ADRs from .brain/decisions", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-adr-discover-"));
  try {
    const decDir = path.join(tmpDir, ".brain", "decisions");
    fs.mkdirSync(decDir, { recursive: true });
    fs.writeFileSync(path.join(decDir, "0002-router.md"), "# ADR 0002: Router Architecture\nStatus: Proposed\n");
    fs.writeFileSync(path.join(decDir, "0001-stack.md"), "# ADR 0001: Stack\nStatus: Accepted\n");

    const adrs = discoverAdrs(tmpDir);
    assert.equal(adrs.length, 2);
    assert.equal(adrs[0].id, "0001");
    assert.equal(adrs[1].id, "0002");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("routeRelevantAdrs ranks ADR matching query ID or title", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-adr-route-"));
  try {
    const decDir = path.join(tmpDir, ".brain", "decisions");
    fs.mkdirSync(decDir, { recursive: true });
    fs.writeFileSync(
      path.join(decDir, "0001-implementation-stack.md"),
      "# ADR 0001: Implementation Stack Selection\n\nStatus: Accepted\nTypeScript ESM stack choice.\n"
    );

    const query = parseTaskQuery("Why did we decide on TypeScript implementation stack in ADR 0001?");
    assert.notEqual(query, null);

    const ranked = routeRelevantAdrs(tmpDir, query!);
    assert.equal(ranked.length, 1);
    assert.equal(ranked[0].path, ".brain/decisions/0001-implementation-stack.md");
    assert.ok(ranked[0].score >= 90);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
