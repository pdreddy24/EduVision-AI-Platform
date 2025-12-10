import mongoose from "mongoose";

const { Schema } = mongoose;

const HistorySchema = new Schema({
  filename: { type: String },
  summary: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  size: { type: Number },
  mimeType: { type: String },
  pdfUrl: { type: String },
  imageUrl: { type: String },
  videoUrl: { type: String },
});

const UserStatsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  filesUploaded: { type: Number, default: 0 },
  totalSummaries: { type: Number, default: 0 },
  history: { type: [HistorySchema], default: [] },
});

export default mongoose.models.UserStats || mongoose.model("UserStats", UserStatsSchema);
