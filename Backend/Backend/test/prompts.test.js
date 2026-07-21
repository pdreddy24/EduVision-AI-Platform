import assert from "node:assert/strict";
import test from "node:test";
import { TECH_KEYWORDS, makeImagePrompt, makeVideoPrompt } from "../utils/prompts.js";

test("technical keywords contain useful classification terms", () => {
  assert.ok(TECH_KEYWORDS.includes("machine learning"));
  assert.ok(TECH_KEYWORDS.includes("software"));
});

test("media prompts include the supplied summary", () => {
  const summary = "A neural network classifies images.";

  assert.match(makeImagePrompt(summary), /neural network classifies images/);
  assert.match(makeVideoPrompt(summary, 4), /4-second/);
  assert.match(makeVideoPrompt(summary, 4), /neural network classifies images/);
});
