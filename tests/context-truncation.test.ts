import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { truncateContentToLimit } from "../src/context/context-limits.js";
import { parseTaskQuery } from "../src/router/query.js";
import { createContextInput, assembleContext } from "../src/context/context-selector.js";
import { contextCommand, CONTEXT_SUCCESS, CONTEXT_FAILURE } from "../src/commands/context.js";

test("B5 regression: truncation centers around matched symbol near the end of a file rather than only keeping the beginning", () => {
  // Create a 2000-character file where lines 1-50 are comments and the target function is at the end
  const paddingLines = Array.from({ length: 60 }, (_, i) => `// Boilerplate comment line ${i + 1}`).join("\n");
  const targetCode = `
export function processPaymentWithStripe(token: string) {
  return "payment_success_" + token;
}
`;
  const fileContent = `${paddingLines}\n${targetCode}`;
  assert.ok(fileContent.length > 1500);

  // Truncate to limit of 400 characters, targeting "processPaymentWithStripe"
  const result = truncateContentToLimit(fileContent, {
    maxCharacters: 400,
    focusTokens: ["processPaymentWithStripe"],
    filePath: "src/payment.ts",
  });

  assert.equal(result.truncated, true);
  assert.ok(result.content.length <= 400, `Output length (${result.content.length}) must not exceed maxCharacters (400)`);
  assert.ok(result.content.includes("processPaymentWithStripe"), "Must retain the relevant symbol near the end");
  assert.ok(result.content.includes("lines 1-"), "Must include line omission marker");
  assert.ok(result.content.includes("src/payment.ts"), "Marker should include file path");
});

test("B5 regression: prefix fallback truncation includes omission marker and preserves prefix", () => {
  const longContent = "const x = 1;\n".repeat(100);
  const result = truncateContentToLimit(longContent, 100);

  assert.equal(result.truncated, true);
  assert.ok(result.content.includes("const x = 1;"));
  assert.ok(result.content.includes("lines omitted"), "Must contain lines omitted marker");
});

test("B4 regression: context character budget flags are respected by CLI and assembleContext", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brainmap-b4-ctx-"));
  try {
    const srcDir = path.join(tmpDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    fs.writeFileSync(path.join(srcDir, "auth1.ts"), "export const auth1 = 'a'.repeat(200);", "utf8");
    fs.writeFileSync(path.join(srcDir, "auth2.ts"), "export const auth2 = 'b'.repeat(200);", "utf8");

    const query = parseTaskQuery(["auth"]);
    assert.ok(query);

    // Context with tight budget of 100 characters should omit items that don't fit
    const input = createContextInput(tmpDir, query, { maxCharacters: 100 });
    const payload = assembleContext(input);

    assert.ok(payload.totalCharacters <= 100, "Total characters must stay within budget");

    // CLI with budget options
    assert.equal(
      contextCommand(["auth", "--max-chars", "500", "--max-files", "2", "--min-score", "50"]),
      CONTEXT_SUCCESS
    );
    assert.equal(
      contextCommand(["auth", "--max-chars", "invalid"]),
      CONTEXT_FAILURE
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
