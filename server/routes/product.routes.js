// routes/product.routes.js
import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// GET /api/products  -> सभी products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/products -> नया product add
router.post("/", async (req, res) => {
  try {
    const { model, price, image, stock } = req.body;

    const product = new Product({
      title: model,       // ya model: model – jaisa schema hai
      model,
      price,
      image,
      stock,
    });

    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("POST /products error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/products/:id -> update
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    console.error("PUT /products error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/products/:id -> delete
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /products error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
