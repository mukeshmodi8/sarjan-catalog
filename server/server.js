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

// ----- __dirname setup (ESM) -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----- ENV -----
dotenv.config(); // Render + local दोनों पर काम करेगा

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment variables!");
  // Render पर error दिख जाए इसलिए:
  // process.exit(1);  // चाहो तो enable कर सकते हो
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
      "http://localhost:5174",               // ← यहाँ add करिए
      "https://sarjan-catalog-1.onrender.com"
    ],
    credentials: true,
  })
);



// ----- STATIC -----
app.use("/uploads", express.static(uploadPath));

// ----- HEALTH CHECK ROUTE (test के लिए) -----
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
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    // Render पर service crash करवानी हो तो:
    // process.exit(1);
  });
