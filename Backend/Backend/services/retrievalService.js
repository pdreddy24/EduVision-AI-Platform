const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "with",
]);

function stemTerm(term) {
  // Examples: studies → study, companies → company
  if (term.endsWith("ies") && term.length > 4) {
    return `${term.slice(0, -3)}y`;
  }

  // Examples: matches → match, classes → class
  if (/(ches|shes|sses|xes|zes)$/.test(term)) {
    return term.slice(0, -2);
  }

  // Examples: templates → template, documents → document
  if (
    term.endsWith("s") &&
    !term.endsWith("ss") &&
    term.length > 3
  ) {
    return term.slice(0, -1);
  }

  // Examples: learning → learn, processing → process
  if (term.endsWith("ing") && term.length > 5) {
    return term.slice(0, -3);
  }

  // Examples: optimized → optimiz, described → describ
  if (term.endsWith("ed") && term.length > 4) {
    return term.slice(0, -2);
  }

  return term;
}

function terms(text = "") {
  const matchedTerms =
    text.toLowerCase().match(/[a-z0-9][a-z0-9_-]{1,}/g) || [];

  return matchedTerms
    .filter((term) => !STOP_WORDS.has(term))
    .map(stemTerm);
}

export function rankChunks(query, chunks, topK = 5) {
  const queryTerms = terms(query);

  if (!queryTerms.length || !Array.isArray(chunks) || !chunks.length) {
    return [];
  }

  const documents = chunks.map((chunk) => terms(chunk.text));

  const averageLength =
    documents.reduce((sum, documentTerms) => {
      return sum + documentTerms.length;
    }, 0) / Math.max(documents.length, 1);

  const documentFrequency = new Map();

  for (const documentTerms of documents) {
    for (const term of new Set(documentTerms)) {
      documentFrequency.set(
        term,
        (documentFrequency.get(term) || 0) + 1
      );
    }
  }

  const scoredChunks = chunks.map((chunk, index) => {
    const documentTerms = documents[index];
    const frequencies = new Map();

    for (const term of documentTerms) {
      frequencies.set(term, (frequencies.get(term) || 0) + 1);
    }

    let score = 0;

    for (const term of queryTerms) {
      const frequency = frequencies.get(term) || 0;

      if (!frequency) {
        continue;
      }

      const documentCount = documentFrequency.get(term) || 0;

      const inverseDocumentFrequency = Math.log(
        1 +
          (chunks.length - documentCount + 0.5) /
            (documentCount + 0.5)
      );

      const denominator =
        frequency +
        1.2 *
          (
            1 -
            0.75 +
            0.75 *
              (documentTerms.length / Math.max(averageLength, 1))
          );

      score +=
        inverseDocumentFrequency *
        ((frequency * 2.2) / denominator);
    }

    return {
      ...chunk,
      score: Number(score.toFixed(4)),
    };
  });

  const safeTopK = Math.min(
    Math.max(Number.parseInt(topK, 10) || 5, 1),
    10
  );

  return scoredChunks
    .filter((chunk) => chunk.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, safeTopK);
}