import { countTokens } from "./tokenService.js";

const PAGE_NUMBER_PATTERN = /^\s*(?:page\s+)?\d+(?:\s+of\s+\d+)?\s*$/i;

function normalizeLine(line) {
  return line.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeText(text = "") {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanDocumentPages(pages = []) {
  const occurrences = new Map();
  for (const page of pages) {
    const uniqueLines = new Set(
      String(page.text || "").split(/\r?\n/).map(normalizeLine).filter((line) => line.length >= 3 && line.length <= 120)
    );
    for (const line of uniqueLines) occurrences.set(line, (occurrences.get(line) || 0) + 1);
  }

  const repeatedThreshold = Math.max(2, Math.ceil(pages.length * 0.5));
  const repeatedLines = new Set(
    [...occurrences.entries()].filter(([, count]) => count >= repeatedThreshold).map(([line]) => line)
  );
  const seenParagraphs = new Set();

  return pages.map((page) => {
    const original = String(page.text || "");
    const withoutBoilerplate = original
      .split(/\r?\n/)
      .filter((line) => !PAGE_NUMBER_PATTERN.test(line))
      .filter((line) => !repeatedLines.has(normalizeLine(line)))
      .join("\n");

    const paragraphs = withoutBoilerplate.split(/\n\s*\n/);
    const kept = [];
    for (const paragraph of paragraphs) {
      const cleaned = normalizeText(paragraph);
      if (!cleaned) continue;
      const key = normalizeLine(cleaned);
      if (seenParagraphs.has(key)) continue;
      seenParagraphs.add(key);
      kept.push(cleaned);
    }
    const text = kept.join("\n\n");
    return {
      pageNumber: page.pageNumber,
      text,
      removedCharacterCount: Math.max(0, original.length - text.length),
    };
  });
}

function isHeading(paragraph) {
  const value = paragraph.trim();
  return value.length <= 100 && (
    /^(?:chapter|section|unit|module|lesson|part)\b/i.test(value) ||
    /^\d+(?:\.\d+)*[.)]?\s+\S+/.test(value) ||
    (value.length >= 3 && value === value.toUpperCase())
  );
}

function splitOversizedText(text, maxTokens) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const parts = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence.trim()}` : sentence.trim();
    if (current && countTokens(candidate) > maxTokens) {
      parts.push(current);
      current = sentence.trim();
    } else {
      current = candidate;
    }
  }
  if (current) parts.push(current);
  return parts.flatMap((part) => {
    if (countTokens(part) <= maxTokens) return [part];
    const words = part.split(/\s+/);
    const slices = [];
    let slice = "";
    for (const word of words) {
      const candidate = slice ? `${slice} ${word}` : word;
      if (slice && countTokens(candidate) > maxTokens) {
        slices.push(slice);
        slice = word;
      } else slice = candidate;
    }
    if (slice) slices.push(slice);
    return slices;
  });
}

export function createSemanticChunks(cleanedPages, { targetTokens = 450, maxTokens = 700 } = {}) {
  const blocks = [];
  let currentHeading = null;
  for (const page of cleanedPages) {
    const paragraphs = page.text.split(/\n\s*\n/).map((value) => value.trim()).filter(Boolean);
    for (const paragraph of paragraphs) {
      if (isHeading(paragraph)) currentHeading = paragraph;
      for (const text of splitOversizedText(paragraph, maxTokens)) {
        blocks.push({ text, pageNumber: page.pageNumber, heading: currentHeading });
      }
    }
  }

  const chunks = [];
  let current = null;
  for (const block of blocks) {
    const headingChanged = current?.heading && block.heading && current.heading !== block.heading;
    const candidate = current ? `${current.text}\n\n${block.text}` : block.text;
    if (current && (headingChanged || countTokens(candidate) > targetTokens)) {
      chunks.push(current);
      current = null;
    }
    if (!current) {
      current = { text: block.text, pageNumbers: [block.pageNumber], heading: block.heading };
    } else {
      current.text = candidate;
      if (!current.pageNumbers.includes(block.pageNumber)) current.pageNumbers.push(block.pageNumber);
    }
  }
  if (current) chunks.push(current);

  return chunks.map((chunk, chunkIndex) => ({
    ...chunk,
    chunkIndex,
    tokenCount: countTokens(chunk.text),
  }));
}

export function optimizeDocument(pages) {
  const originalText = pages.map((page) => page.text).filter(Boolean).join("\n\n");
  const cleanedPages = cleanDocumentPages(pages);
  const cleanedText = cleanedPages.map((page) => page.text).filter(Boolean).join("\n\n");
  const chunks = createSemanticChunks(cleanedPages);
  const originalTokens = countTokens(originalText);
  const cleanedTokens = countTokens(cleanedText);
  const savedTokens = Math.max(0, originalTokens - cleanedTokens);
  return {
    cleanedPages,
    chunks,
    metrics: {
      originalTokens,
      cleanedTokens,
      savedTokens,
      savingsPercentage: originalTokens ? Number(((savedTokens / originalTokens) * 100).toFixed(1)) : 0,
      chunkCount: chunks.length,
    },
  };
}
