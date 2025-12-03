// server/routes/product.routes.js
import express from "express";
import ProductController from "../controllers/product.controller.js";

const router = express.Router();

// GET /api/products
router.get("/", ProductController.listProducts);

// GET /api/products/:id
router.get("/:id", ProductController.getProduct);

// POST /api/products
router.post("/", ProductController.createProduct);

// PUT /api/products/:id
router.put("/:id", ProductController.updateProduct);

// DELETE /api/products/:id
router.delete("/:id", ProductController.deleteProduct);

export default router;
