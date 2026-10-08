import test from "node:test";
import assert from "node:assert/strict";
import {
  createRelevanceRanking,
  CandidateMatchInput,
} from "../src/router/ranking.js";

test("createRelevanceRanking sorts items by score in descending order", () => {
  const inputs: CandidateMatchInput[] = [
    { path: "src/cli.ts", category: "source-file", score: 60, reason: "stem match" },
    { path: ".brain/architecture.md", category: "brain-doc", score: 95, reason: "role intent" },
    { path: "src/router/query.ts", category: "source-file", score: 80, reason: "symbol match" },
  ];

  const ranked = createRelevanceRanking(inputs);
  assert.equal(ranked.length, 3);
  assert.equal(ranked[0].path, ".brain/architecture.md");
  assert.equal(ranked[1].path, "src/router/query.ts");
  assert.equal(ranked[2].path, "src/cli.ts");
});

test("createRelevanceRanking boosts score and combines reasons for multiple hits on same path", () => {
  const inputs: CandidateMatchInput[] = [
    { path: "src/router/query.ts", category: "source-file", score: 80, reason: "filename match" },
    { path: "src/router/query.ts", category: "source-file", score: 90, reason: "symbol match: parseTaskQuery" },
  ];

  const ranked = createRelevanceRanking(inputs);
  assert.equal(ranked.length, 1);
  assert.ok(ranked[0].score > 90);
  assert.equal(ranked[0].reasons.length, 2);
  assert.ok(ranked[0].reasons.includes("filename match"));
  assert.ok(ranked[0].reasons.includes("symbol match: parseTaskQuery"));
});

test("createRelevanceRanking caps boosted score at 100", () => {
  const inputs: CandidateMatchInput[] = [
    { path: "src/cli.ts", category: "source-file", score: 100, reason: "exact path" },
    { path: "src/cli.ts", category: "source-file", score: 100, reason: "exact filename" },
  ];

  const ranked = createRelevanceRanking(inputs);
  assert.equal(ranked[0].score, 100);
});

test("createRelevanceRanking breaks ties deterministically by category and path", () => {
  const inputs: CandidateMatchInput[] = [
    { path: "src/b.ts", category: "source-file", score: 80, reason: "match" },
    { path: "src/a.ts", category: "source-file", score: 80, reason: "match" },
    { path: ".brain/state.md", category: "brain-doc", score: 80, reason: "match" },
  ];

  const ranked = createRelevanceRanking(inputs);
  assert.equal(ranked[0].path, ".brain/state.md"); // brain-doc has priority over source-file
  assert.equal(ranked[1].path, "src/a.ts");
  assert.equal(ranked[2].path, "src/b.ts");
});

test("createRelevanceRanking handles empty input array", () => {
  assert.deepEqual(createRelevanceRanking([]), []);
});
