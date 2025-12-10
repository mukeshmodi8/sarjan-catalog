// server/models/Product.js  (ya product.model.js – jo bhi tum use कर रहे हो)
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

    // 👇👇 NEW FIELDS
    category: {
      type: String,
      default: "",
      trim: true,
    },
    subcategory: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
