import express from "express";
import multer from "multer";
import { summarizePdf } from "../controllers/summarizeController.js";

const router = express.Router();

// Store PDF in memory buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter(req, file, callback) {
    if (file.mimetype !== "application/pdf") {
      return callback(Object.assign(new Error("Uploaded file must be a PDF"), { status: 415 }));
    }
    return callback(null, true);
  },
});

// /summarize/pdf → classify + summarize
// public route: controller will verify Bearer token if provided
router.post("/pdf", upload.single("file"), summarizePdf);

export default router;
