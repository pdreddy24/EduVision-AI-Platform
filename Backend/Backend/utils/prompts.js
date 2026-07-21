export const TECH_KEYWORDS = [
  "algorithm",
  "api",
  "architecture",
  "artificial intelligence",
  "cloud",
  "computer",
  "database",
  "data structure",
  "deep learning",
  "engineering",
  "framework",
  "machine learning",
  "model",
  "network",
  "neural network",
  "programming",
  "protocol",
  "security",
  "software",
  "system",
];

export function makeImagePrompt(summary) {
  return [
    "Create a clear educational illustration for the following technical summary.",
    "Use a clean diagram-like composition, accurate relationships, and no logos.",
    "Avoid dense paragraphs and unreadable small text.",
    "",
    summary,
  ].join("\n");
}

export function makeVideoPrompt(summary, seconds) {
  return [
    `Create a concise ${seconds}-second educational visualization based on this technical summary.`,
    "Use clear motion, professional styling, and no logos or watermarks.",
    "Do not invent facts that are absent from the summary.",
    "",
    summary,
  ].join("\n");
}
