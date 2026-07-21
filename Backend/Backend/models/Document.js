import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({
  pageNumber: { type: Number, required: true, min: 1 },
  text: { type: String, default: "" },
  extractionMethod: { type: String, enum: ["native", "ocr", "empty"], required: true },
  characterCount: { type: Number, default: 0, min: 0 },
}, { _id: false });

const optimizationSchema = new mongoose.Schema({
  originalTokens: { type: Number, default: 0, min: 0 },
  cleanedTokens: { type: Number, default: 0, min: 0 },
  savedTokens: { type: Number, default: 0, min: 0 },
  savingsPercentage: { type: Number, default: 0, min: 0, max: 100 },
  chunkCount: { type: Number, default: 0, min: 0 },
  optimizedAt: { type: Date, default: null },
}, { _id: false });

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  originalName: { type: String, required: true, trim: true },
  mimeType: { type: String, required: true },
  extension: { type: String, required: true },
  size: { type: Number, required: true, min: 0 },
  storageDriver: { type: String, enum: ["local", "s3"], default: "local" },
  storageKey: { type: String, default: null },
  status: { type: String, enum: ["queued", "processing", "completed", "failed"], default: "queued", index: true },
  jobId: { type: String, default: null, index: true },
  attempts: { type: Number, default: 0, min: 0 },
  processingStartedAt: { type: Date, default: null },
  processingCompletedAt: { type: Date, default: null },
  pages: { type: [pageSchema], default: [] },
  pageCount: { type: Number, default: 0, min: 0 },
  fullText: { type: String, default: "" },
  characterCount: { type: Number, default: 0, min: 0 },
  usedOcr: { type: Boolean, default: false },
  optimization: { type: optimizationSchema, default: null },
  errorMessage: { type: String, default: null },
}, { timestamps: true });

documentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Document", documentSchema);
