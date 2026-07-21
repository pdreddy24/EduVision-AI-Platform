import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedOrigins, validateEnv } from "../config/env.js";

const REQUIRED_VALUES = {
  MONGO_URI: "mongodb://127.0.0.1:27017/test",
  ACCESS_TOKEN_SECRET: "access-secret-for-tests",
  REFRESH_TOKEN_SECRET: "refresh-secret-for-tests",
  OPENAI_API_KEY: "test-key",
  SUMMARY_MODEL: "summary-model",
  IMAGE_MODEL: "image-model",
  VIDEO_MODEL: "video-model",
};

test("validateEnv applies safe development defaults", () => {
  Object.assign(process.env, REQUIRED_VALUES, { NODE_ENV: "development" });
  delete process.env.PORT;
  delete process.env.ACCESS_TOKEN_EXPIRY;

  validateEnv();

  assert.equal(process.env.PORT, "5000");
  assert.equal(process.env.ACCESS_TOKEN_EXPIRY, "15m");
});

test("getAllowedOrigins normalizes, deduplicates, and removes trailing slashes", () => {
  process.env.FRONTEND_URL = "https://app.example.com/";
  process.env.FRONTEND_URLS = "https://admin.example.com/, https://app.example.com";

  assert.deepEqual(getAllowedOrigins(), [
    "http://localhost:5173",
    "https://admin.example.com",
    "https://app.example.com",
  ]);
});
