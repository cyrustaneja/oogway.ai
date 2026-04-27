import { parseLlmJson } from "../lib/pipeline/lib/json-parse";
import { validateRubricScore } from "../lib/pipeline/lib/rubric-validator";

/**
 * V1 ACCEPTANCE TESTS
 */

async function testJsonHardening() {
  console.log("--- Testing JSON Hardening ---");
  const payloads = [
    { name: "Clean JSON", input: '{"ok": true}' },
    { name: "Markdown Fence", input: '```json\n{"ok": true}\n```' },
    { name: "Trailing Comma", input: '{"ok": true,}' },
    { name: "Truncated Tail", input: '{"ok": true, "list": [1, 2, ' }
  ];

  payloads.forEach(p => {
    const { data, repaired, issues } = parseLlmJson<any>(p.input);
    console.log(`[${p.name}] data: ${!!data} | repaired: ${repaired} | issues: ${issues.join(", ")}`);
  });
}

async function testRubricValidator() {
  console.log("\n--- Testing Rubric Validator ---");
  const testData = {
    rubric: "context_setup",
    payload: {
      score: 3,
      label: "Structured",
      evidence: [
        { timestamp: "00:01:23", verbatim_quote: "Today we will cover X, Y, Z." }
      ]
    }
  };

  const { ok, issues } = validateRubricScore(testData.rubric as any, testData.payload);
  console.log(`[Valid Rubric] ok: ${ok} | issues: ${issues.map(i => i.code).join(", ")}`);
}

async function main() {
  await testJsonHardening();
  await testRubricValidator();
}

main().catch(console.error);
