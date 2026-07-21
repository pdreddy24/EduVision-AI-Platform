import mongoose from "mongoose";

const citationSchema = new mongoose.Schema({
  sourceId: { type: Number, required: true, min: 1 },
  pageNumbers: [{ type: Number, min: 1 }],
  quote: { type: String, default: "" },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  citations: { type: [citationSchema], default: [] },
  grounded: { type: Boolean, default: true },
  inputTokens: { type: Number, default: 0, min: 0 },
  outputTokens: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
  title: { type: String, required: true, maxlength: 100 },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

conversationSchema.index({ userId: 1, documentId: 1, updatedAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
