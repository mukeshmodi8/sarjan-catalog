// server/models/product.model.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    model: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
