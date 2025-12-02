import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import productRoutes from "./routes/product.routes.js"
import imageProxyRoutes from "./routes/imageProxy.js"; 

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://sarjan-catalog.onrender.com",
      "https://sarjan-catalog-1.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Sarjan Backend is Running ✅");
});

app.use("/api/products", productRoutes);
app.use("/api", imageProxyRoutes);

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
