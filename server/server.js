import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/upload.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("server/uploads"));

app.use("/api", productRoutes);
app.use("/api", authRoutes);
app.use("/api", uploadRoutes);

mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("MongoDB Connected");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
