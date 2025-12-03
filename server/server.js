// server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/upload.routes.js";
import imageProxyRoutes from "./routes/imageProxy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// ---------- CREATE uploads folder if not exists ----------
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("Uploads folder created:", uploadPath);
}

// ---------- MIDDLEWARE ----------
app.use(express.json());

// ⭐ ONLY ONE CORS middleware (correct origin)
// NOTE: remove trailing slashes in origin strings
app.use(cors({
  origin: ["https://sarjan-catalog.onrender.com", "http://localhost:5173"],
  credentials: true
}));

// ---------- STATIC ----------
app.use("/uploads", express.static(uploadPath));

// ---------- ROUTES ----------
app.use("/api/products", productRoutes);
app.use("/api", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api", imageProxyRoutes);

// ---------- MONGO ----------
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error("MongoDB Error:", err.message));

// ---------- SERVER ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
