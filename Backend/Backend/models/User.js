import mongoose from "mongoose";
import Counter from "./Counter.js";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  customId: { type: String, unique: true, required: true },
}, {
  timestamps: true
});

// generate customId like AI001, AI002
userSchema.pre("validate", async function (next) {
  try {
    if (this.isNew && !this.customId) {
      // Atomically increment a counter document to avoid race conditions
      const counter = await Counter.findByIdAndUpdate(
        "user_customId",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const nextNumber = counter.seq;
      this.customId = `AI${String(nextNumber).padStart(3, "0")}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("User", userSchema);
