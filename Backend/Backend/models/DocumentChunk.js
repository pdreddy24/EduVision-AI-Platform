import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  chunkIndex: { type: Number, required: true, min: 0 },
  text: { type: String, required: true },
  tokenCount: { type: Number, required: true, min: 1 },
  pageNumbers: [{ type: Number, min: 1 }],
  heading: { type: String, default: null },
}, { timestamps: true });

documentChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });
documentChunkSchema.index({ userId: 1, documentId: 1 });

export default mongoose.model("DocumentChunk", documentChunkSchema);
