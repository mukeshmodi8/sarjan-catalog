// server/models/Product.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  model: { type: String, required: true },
  price: { type: Number, default: 0 },
  image: { type: String, default: "" },
  stock: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Product", ProductSchema);
