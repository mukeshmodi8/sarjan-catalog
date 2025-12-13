// server.js (improved)
import dotenv from "dotenv";
dotenv.config(); // load env first

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/upload.routes.js";
import imageProxyRoutes from "./routes/imageProxy.js";

// ----- __dirname setup (ESM) -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----- CONFIG -----
const MONGO_URI = process.env.MONGO_URI;
const PORT = Number(process.env.PORT || 5000);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:5174").split(",");

// basic validation
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment variables! Exiting.");
  process.exit(1);
}

// ----- APP INIT -----
const app = express();

// ----- CREATE uploads FOLDER -----
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("Uploads folder created:", uploadPath);
}

// ----- MIDDLEWARE -----
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://sarjan-catalog-1.onrender.com",
      "https://sarjan-catalog.onrender.com",
    ],
    credentials: true,
  })
);


// ----- STATIC -----
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ----- HEALTH CHECK -----
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Sarjan Catalog API is live 🚀" });
});

// ----- API ROUTES -----
app.use("/api/products", productRoutes);
app.use("/api", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api", imageProxyRoutes);

// ----- MONGO + SERVER START -----
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // handle server errors (e.g. EADDRINUSE)
    server.on("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });

    // graceful shutdown
    const shutdown = async () => {
      console.log("Shutting down...");
      await mongoose.disconnect();
      server.close(() => process.exit(0));
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

// catch unhandled rejections
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
