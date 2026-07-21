import "dotenv/config";
import { Worker } from "bullmq";
import connectDB from "../config/db.js";
import { validateEnv } from "../config/env.js";
import Document from "../models/Document.js";
import { parseDocument } from "../services/documentParser.js";
import { DOCUMENT_QUEUE_NAME } from "../services/documentQueue.js";
import { redisConnectionOptions } from "../services/redisConnection.js";
import { deleteDocumentObject, getDocumentObject } from "../services/objectStorage.js";
import { logger } from "../services/logger.js";

validateEnv();
await connectDB();

function withTimeout(promise, timeoutMs) {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Document parsing timed out after ${timeoutMs} ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const worker = new Worker(DOCUMENT_QUEUE_NAME, async (job) => {
  const { documentId, storageKey, originalName, mimeType } = job.data;
  const document = await Document.findById(documentId);
  if (!document) throw new Error("Queued document no longer exists");
  document.status = "processing";
  document.attempts = job.attemptsMade + 1;
  document.processingStartedAt = new Date();
  document.errorMessage = null;
  await document.save();

  try {
    const buffer = await getDocumentObject(storageKey);
    const parsed = await withTimeout(
      parseDocument({ originalname: originalName, mimetype: mimeType, buffer }),
      Number(process.env.PARSER_TIMEOUT_MS || 120000),
    );
    Object.assign(document, parsed, {
      status: "completed",
      errorMessage: null,
      processingCompletedAt: new Date(),
    });
    await document.save();
    if (process.env.DELETE_SOURCE_AFTER_PARSE === "true") await deleteDocumentObject(storageKey).catch(() => {});
    return { documentId, pageCount: parsed.pageCount, usedOcr: parsed.usedOcr };
  } catch (error) {
    const finalAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 1);
    document.status = finalAttempt ? "failed" : "queued";
    document.errorMessage = error.message;
    if (finalAttempt) document.processingCompletedAt = new Date();
    await document.save().catch(() => {});
    if (finalAttempt && process.env.DELETE_SOURCE_AFTER_PARSE === "true") await deleteDocumentObject(storageKey).catch(() => {});
    throw error;
  }
}, {
  connection: redisConnectionOptions(),
  concurrency: Math.max(1, Number(process.env.PARSER_CONCURRENCY || 2)),
});

worker.on("completed", (job, result) => logger.info({ jobId: job.id, result }, "parser job completed"));
worker.on("failed", (job, error) => logger.error({ jobId: job?.id, err: error }, "parser job failed"));
worker.on("error", (error) => logger.error({ err: error }, "parser worker error"));

async function shutdown(signal) {
  logger.info({ signal }, "closing parser worker");
  await worker.close();
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
