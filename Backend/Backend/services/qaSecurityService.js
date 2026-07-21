const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?/i,
  /(?:reveal|show|print|repeat)\s+(?:the\s+)?(?:system|developer)\s+(?:prompt|message|instructions?)/i,
  /act\s+as\s+(?:an?\s+)?(?:unrestricted|jailbroken|different)/i,
  /(?:bypass|disable|override)\s+(?:the\s+)?(?:rules?|safety|guardrails?|instructions?)/i,
  /you\s+are\s+now\s+(?:in\s+)?developer\s+mode/i,
  /<\/?(?:system|developer|assistant|tool)>/i,
];

function normalized(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function validateQuestion(value) {
  const question = String(value || "").replace(/\u0000/g, "").trim();
  if (question.length < 2) return { valid: false, reason: "Question must contain at least 2 characters" };
  if (question.length > 500) return { valid: false, reason: "Question must not exceed 500 characters" };
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(question))) {
    return { valid: false, reason: "Question contains instructions that are not allowed" };
  }
  return { valid: true, question };
}

export function sanitizeContext(text = "") {
  return String(text)
    .replace(/<\/?(?:system|developer|assistant|tool)>/gi, "[removed]")
    .replace(/ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?/gi, "[untrusted instruction removed]")
    .slice(0, 20000);
}

export function validateCitations(citations, sources) {
  const sourceMap = new Map(sources.map((source) => [source.sourceId, source]));
  if (!Array.isArray(citations)) return [];
  return citations
    .filter((citation) => Number.isInteger(citation?.sourceId) && sourceMap.has(citation.sourceId))
    .map((citation) => {
      const source = sourceMap.get(citation.sourceId);
      const allowedPages = new Set(source.pageNumbers);
      const quote = String(citation.quote || "").slice(0, 240).trim();
      const quoteIsGrounded = quote.length >= 3 && normalized(source.text).includes(normalized(quote));
      return {
        sourceId: citation.sourceId,
        pageNumbers: [...new Set((citation.pageNumbers || []).filter((page) => allowedPages.has(page)))],
        quote: quoteIsGrounded ? quote : "",
      };
    })
    .filter((citation) => citation.pageNumbers.length > 0 && citation.quote);
}
