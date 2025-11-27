import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// GET all
router.get("/products", async (req, res) => {
  try {
    const list = await Product.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE
router.post("/products", async (req, res) => {
  try {
    const { model, price, image, stock } = req.body;
    const product = new Product({ model, price, image, stock });
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE
router.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { model, price, image, stock } = req.body;

    const updated = await Product.findByIdAndUpdate(
      id,
      { model, price, image, stock },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE
router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
