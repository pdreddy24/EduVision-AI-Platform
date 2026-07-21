import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

export async function getDailyQaTokens(userId, now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const [usage] = await Conversation.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), updatedAt: { $gte: start } } },
    { $unwind: "$messages" },
    { $match: { "messages.role": "assistant", "messages.createdAt": { $gte: start } } },
    { $group: { _id: null, tokens: { $sum: { $add: ["$messages.inputTokens", "$messages.outputTokens"] } } } },
  ]);
  return usage?.tokens || 0;
}

export async function assertQaBudgetAvailable(userId) {
  const limit = Number(process.env.MAX_DAILY_QA_TOKENS_PER_USER || 100000);
  if (limit <= 0) return;
  const used = await getDailyQaTokens(userId);
  if (used >= limit) {
    const error = new Error("Daily Q&A token limit reached. Try again tomorrow.");
    error.status = 429;
    error.code = "DAILY_QA_TOKEN_LIMIT";
    throw error;
  }
}
