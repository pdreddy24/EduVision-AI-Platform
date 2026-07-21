import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { rateLimit } from "express-rate-limit";
import connectDB from "./config/db.js";
import { getAllowedOrigins, validateEnv } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import dashRoutes from "./routes/dashRoutes.js";
import summarizeRoutes from "./routes/summarizeRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import trackRoutes from "./routes/trackRoutes.js";
import { closeDocumentQueue } from "./services/documentQueue.js";
import { getDocumentQueue } from "./services/documentQueue.js";
import { logger, requestLogger } from "./services/logger.js";

validateEnv();
await connectDB();
const app = express();
app.disable("x-powered-by");
// Browser -> CloudFront -> ALB -> Express. Trust exactly those two proxy hops.
app.set("trust proxy", 2);
app.use(requestLogger);
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT_PER_15_MIN || 300),
  standardHeaders: "draft-8",
  legacyHeaders: false,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
const allowedOrigins = getAllowedOrigins();
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(Object.assign(new Error("Origin not allowed by CORS"), { status: 403 }));
  },
  credentials: true,
}));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/auth", authRoutes);
app.use("/auth", profileRoutes);
app.use("/dash", dashRoutes);
app.use("/summarize", summarizeRoutes);
app.use("/documents", documentRoutes);
app.use("/conversations", conversationRoutes);
app.use("/track", trackRoutes);
app.get("/health/live", (req, res) => res.json({ status: "ok" }));
app.get("/health/ready", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) throw new Error("MongoDB is not connected");
    const redis = await getDocumentQueue().client;
    if (await redis.ping() !== "PONG") throw new Error("Redis is not ready");
    return res.json({ status: "ready", mongo: "ok", redis: "ok" });
  } catch (error) {
    req.log.warn({ err: error }, "readiness check failed");
    return res.status(503).json({ status: "not_ready" });
  }
});
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => logger.info({ port: Number(PORT) }, "server started"));
function shutdown(signal) {
  logger.info({ signal }, "closing HTTP server");
  server.close(async () => {
    await closeDocumentQueue();
    process.exit(0);
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
