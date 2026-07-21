import { getEncoding } from "js-tiktoken";

let encoding;

function getTokenizer() {
  if (!encoding) encoding = getEncoding("cl100k_base");
  return encoding;
}

export function countTokens(text = "") {
  if (!text) return 0;
  return getTokenizer().encode(text).length;
}

export function tokenSavings(originalTokens, usedTokens) {
  const savedTokens = Math.max(0, originalTokens - usedTokens);
  return {
    originalTokens,
    usedTokens,
    savedTokens,
    savingsPercentage: originalTokens
      ? Number(((savedTokens / originalTokens) * 100).toFixed(1))
      : 0,
  };
}
