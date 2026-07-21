const DEFAULTS = {
  NODE_ENV: "development",
  PORT: "5000",
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
  VIDEO_SECONDS: "4",
  REDIS_URL: "redis://127.0.0.1:6379",
  PARSER_CONCURRENCY: "2",
  PARSER_TIMEOUT_MS: "120000",
  STORAGE_DRIVER: "local",
  DELETE_SOURCE_AFTER_PARSE: "false",
  MAX_UPLOAD_MB: "20",
  API_RATE_LIMIT_PER_15_MIN: "300",
  MAX_DAILY_QA_TOKENS_PER_USER: "100000",
};

const REQUIRED = [
  "MONGO_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "OPENAI_API_KEY",
  "SUMMARY_MODEL",
  "IMAGE_MODEL",
  "VIDEO_MODEL",
];

export function validateEnv() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (!process.env[key]) process.env[key] = value;
  }

  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  const accessSecret = process.env.ACCESS_TOKEN_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

  if (process.env.NODE_ENV === "production") {
    if (accessSecret.length < 32 || refreshSecret.length < 32) {
      throw new Error("JWT secrets must contain at least 32 characters in production");
    }

    if (!process.env.FRONTEND_URL) {
      throw new Error("FRONTEND_URL is required in production");
    }

    if (process.env.STORAGE_DRIVER === "s3" && !process.env.DOCUMENT_BUCKET) {
      throw new Error("DOCUMENT_BUCKET is required when STORAGE_DRIVER=s3");
    }
  }
}

export function getAllowedOrigins() {
  const configured = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return [...new Set(["http://localhost:5173", ...configured])];
}
