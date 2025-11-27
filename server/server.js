// server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import productRoutes from "./routes/product.routes.js";
// import authRoutes from "./routes/authRoutes.js"; // agar use karna ho to

dotenv.config();

const app = express();

// 🔹 CORS – frontend (local + render) allow
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://sarjan-catalog.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Body parser
app.use(express.json());

// ✅ Test route (Render पर open करके check करोगे)
app.get("/", (req, res) => {
  res.send("Sarjan Backend is Running ✅");
});

// ✅ Products routes
app.use("/api/products", productRoutes);
// app.use("/api/auth", authRoutes); // agar use karo to

// MongoDB connect
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo Error:", err);
  });
