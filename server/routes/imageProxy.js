// routes/imageProxy.js
import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * GET /api/image-proxy?url=<encoded-url>
 * Fetches remote image and streams back to client with proper headers.
 */
router.get("/image-proxy", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "Missing url query parameter" });
    }

    // Basic validation: only allow http/https
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "Invalid url" });
    }

    // Fetch image as stream
    const response = await axios.get(url, {
      responseType: "stream",
      timeout: 15000,
      headers: {
        // optional: pretend to be a browser
        "User-Agent": "Mozilla/5.0 (Node) ImageProxy",
        Accept: "image/*,*/*;q=0.8",
      },
      // If remote server blocks, you may need extra handling
    });

    // Forward content-type and cache headers if present
    const contentType = response.headers["content-type"] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    // Cache for some time (optional)
    res.setHeader("Cache-Control", "public, max-age=86400");

    // Pipe stream
    response.data.pipe(res);
    response.data.on("error", (err) => {
      console.error("Stream error:", err);
      res.end();
    });
  } catch (err) {
    console.error("Image proxy error:", err.message || err);
    // On error, send 502 so frontend knows proxy failed
    res.status(502).json({ error: "Failed to fetch image via proxy" });
  }
});

export default router;
