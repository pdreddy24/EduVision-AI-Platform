import pino from "pino";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: process.env.SERVICE_NAME || "eduvision-api", environment: process.env.NODE_ENV || "development" },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "token", "accessToken", "refreshToken", "OPENAI_API_KEY"],
    censor: "[REDACTED]",
  },
});

export const requestLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const id = req.headers["x-request-id"] || randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  customLogLevel(req, res, error) {
    if (error || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});
