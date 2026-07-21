import { Queue } from "bullmq";
import { redisConnectionOptions } from "./redisConnection.js";

export const DOCUMENT_QUEUE_NAME = "document-parsing";

let queue;
export function getDocumentQueue() {
  if (!queue) queue = new Queue(DOCUMENT_QUEUE_NAME, { connection: redisConnectionOptions() });
  return queue;
}

export function enqueueDocumentParsing(data) {
  return getDocumentQueue().add("parse-document", data, {
    jobId: String(data.documentId),
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400, count: 1000 },
  });
}

export async function closeDocumentQueue() {
  if (queue) await queue.close();
  queue = null;
}
