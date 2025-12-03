// server/server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/upload.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json());

// health and root
app.get("/", (req, res) => res.send("Sarjan Catalog API — server is running."));
app.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// mount routes
// productRoutes MUST export router where route paths are relative ("/")
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);      // keep auth under /api/auth
app.use("/api", uploadRoutes);        // upload routes (like POST /api/upload-image)

// connect to MongoDB
const MONGO = process.env.MONGO_URI || process.env.MONGO;
mongoose
  .connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB Connected ✅");
  })
  .catch((err) => {
    console.error("MongoDB Error:", err.message);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
