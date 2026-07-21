import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getDetails } from "../controllers/dashController.js";

const router = express.Router();

// GET /dash/get-details
router.get("/get-details", verifyToken, getDetails);

export default router;
