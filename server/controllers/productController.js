// controllers/productController.js
import Product from "../models/Product.js";

export const createProduct = async (req, res) => {
  try {
    const { title, description, image, price } = req.body;

    const newProduct = new Product({
      title,
      description,
      image,
      price,
    });

    const saved = await newProduct.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Create product error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
