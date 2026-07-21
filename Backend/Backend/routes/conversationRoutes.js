import express from "express";
import { getConversation } from "../controllers/qaController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);
router.get("/:id", getConversation);
export default router;
