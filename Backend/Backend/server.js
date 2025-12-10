import 'dotenv/config';
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import dashRoutes from "./routes/dashRoutes.js";
import summarizeRoutes from "./routes/summarizeRoutes.js";
import trackRoutes from "./routes/trackRoutes.js";

connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// CORS FIXED ✔️
app.use(cors({
  origin: [
    "http://localhost:5000/",     // Vite frontend
    process.env.FRONTEND_URL     // Production
  ],
  credentials: true,
}));

// Serve uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/auth", authRoutes);
app.use("/auth", profileRoutes);
app.use("/dash", dashRoutes);
app.use("/summarize", summarizeRoutes);

// EVENT TRACKING ✔️
app.use("/track", trackRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
