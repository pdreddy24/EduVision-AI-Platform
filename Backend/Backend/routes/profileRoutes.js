import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getProfile, changePassword, changeName } from "../controllers/profileController.js";

const router = express.Router();

// GET /auth/get-profile
router.get("/get-profile", verifyToken, getProfile);

// POST /auth/change-password
router.put("/change-password", verifyToken, changePassword);

// PUT /auth/change-name
router.put("/change-name", verifyToken, changeName);

export default router;
