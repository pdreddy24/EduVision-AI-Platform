import express from "express";
import multer from "multer";
import { createDocument, getDocument, listDocuments } from "../controllers/documentController.js";
import { optimize, retrieve } from "../controllers/optimizationController.js";
import { askQuestion, listDocumentConversations } from "../controllers/qaController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { isSupportedDocument } from "../services/documentParser.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 20) * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!isSupportedDocument(file)) {
      return callback(Object.assign(new Error("Unsupported document type. Use PDF, PNG, JPEG, DOCX, or TXT."), { status: 415 }));
    }
    return callback(null, true);
  },
});

router.use(verifyToken);
router.get("/", listDocuments);
router.post("/", upload.single("file"), (req, res, next) => req.file ? createDocument(req, res, next) : res.status(400).json({ message: "No document uploaded" }));
router.post("/:id/optimize", optimize);
router.post("/:id/retrieve", retrieve);
router.post("/:id/questions", askQuestion);
router.get("/:id/conversations", listDocumentConversations);
router.get("/:id", getDocument);

export default router;
