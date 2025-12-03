// server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/upload.routes.js";
import imageProxyRoutes from "./routes/imageProxy.js"; // <-- नया

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

console.log("ENV FILE PATH =>", path.join(__dirname, ".env"));
console.log("MONGO_URI =>", process.env.MONGO_URI);

app.use(cors());
app.use(express.json());

// serve uploads folder (static)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// mount routes
app.use("/api/products", productRoutes);
app.use("/api", authRoutes);
app.use("/api", uploadRoutes);

// MOUNT image-proxy router under /api
app.use("/api", imageProxyRoutes); // now GET /api/image-proxy works

// connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB Connected ✅");
  })
  .catch((err) => {
    console.error("MongoDB Error:", err.message);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
