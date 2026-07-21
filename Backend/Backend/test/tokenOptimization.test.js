import test from "node:test";
import assert from "node:assert/strict";
import { countTokens, tokenSavings } from "../services/tokenService.js";
import { cleanDocumentPages, createSemanticChunks, optimizeDocument } from "../services/textOptimizationService.js";
import { rankChunks } from "../services/retrievalService.js";

test("counts model tokens instead of characters", () => {
  const count = countTokens("Token optimization improves retrieval.");
  assert.ok(count >= 4 && count < 20);
});

test("removes repeated headers, page numbers, and duplicate paragraphs", () => {
  const pages = [
    { pageNumber: 1, text: "EDUVISION COURSE\n1\n\nUnique first paragraph." },
    { pageNumber: 2, text: "EDUVISION COURSE\n2\n\nUnique second paragraph.\n\nUnique first paragraph." },
  ];
  const cleaned = cleanDocumentPages(pages);
  assert.doesNotMatch(cleaned[0].text, /EDUVISION COURSE/);
  assert.doesNotMatch(cleaned[0].text, /^1$/m);
  assert.doesNotMatch(cleaned[1].text, /Unique first paragraph/);
});

test("semantic chunks preserve page references and token limits", () => {
  const chunks = createSemanticChunks([
    { pageNumber: 1, text: "CHAPTER ONE\n\nNeural networks learn patterns from examples." },
    { pageNumber: 2, text: "CHAPTER TWO\n\nGraphs represent entities and relationships." },
  ], { targetTokens: 20, maxTokens: 30 });
  assert.ok(chunks.length >= 2);
  assert.deepEqual(chunks[0].pageNumbers, [1]);
  assert.ok(chunks.every((chunk) => chunk.tokenCount <= 30));
});

test("retrieval ranks query-relevant chunks first", () => {
  const ranked = rankChunks("graph relationships", [
    { chunkIndex: 0, text: "Neural networks train with gradients.", tokenCount: 7, pageNumbers: [1] },
    { chunkIndex: 1, text: "A graph models entities and relationships using edges.", tokenCount: 10, pageNumbers: [3] },
  ], 1);
  assert.equal(ranked[0].chunkIndex, 1);
  assert.ok(ranked[0].score > 0);
});

test("optimization reports cleaned token savings", () => {
  const result = optimizeDocument([
    { pageNumber: 1, text: "HEADER\n1\n\nMachine learning uses data." },
    { pageNumber: 2, text: "HEADER\n2\n\nModels learn useful patterns." },
  ]);
  assert.ok(result.metrics.originalTokens >= result.metrics.cleanedTokens);
  assert.equal(result.metrics.savedTokens, result.metrics.originalTokens - result.metrics.cleanedTokens);
  assert.equal(result.metrics.chunkCount, result.chunks.length);
});

test("token savings never becomes negative", () => {
  assert.deepEqual(tokenSavings(10, 12), { originalTokens: 10, usedTokens: 12, savedTokens: 0, savingsPercentage: 0 });
});
