// routes/product.routes.js
import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("Get products error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create product  =>  POST /api/products
router.post("/", async (req, res) => {
  try {
    const { model, price, image, stock, category, subcategory } = req.body;

    const newProduct = await Product.create({
      model,
      price,
      image,
      stock,
      category: category || "",
      subcategory: subcategory || "",
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Create product error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update product  =>  PUT /api/products/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { model, price, image, stock, category, subcategory } = req.body;

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        model,
        price,
        image,
        stock,
        category: category || "",
        subcategory: subcategory || "",
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Update product error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("Delete product error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
