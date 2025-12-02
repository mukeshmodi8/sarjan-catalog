// server/routes/imageProxy.js
import express from "express";

const router = express.Router();

// GET /api/image-proxy?url=...
router.get("/image-proxy", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "Missing url query param" });
    }

    // Node 18+ / Render pe global fetch already hota hai
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Image proxy fetch failed:", response.status, url);
      return res.status(response.status).json({ error: "Failed to fetch image" });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.end(buffer);
  } catch (err) {
    console.error("Image proxy error:", err);
    res.status(500).json({ error: "Proxy error" });
  }
});

export default router;
