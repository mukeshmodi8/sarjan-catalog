// server/routes/imageProxy.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// helper: try to use global.fetch or node-fetch
let fetchFn = global.fetch;
async function ensureNodeFetch() {
  if (!fetchFn) {
    try {
      const nodeFetch = await import("node-fetch");
      fetchFn = nodeFetch.default;
      console.log("[image-proxy] using node-fetch fallback");
    } catch (e) {
      console.warn("[image-proxy] node-fetch import failed:", e && e.message);
    }
  }
}

router.get("/image-proxy", async (req, res) => {
  try {
    const raw = req.query.url;
    if (!raw) return res.status(400).json({ error: "Missing url query param" });

    let url;
    try { url = decodeURIComponent(raw); } catch (e) { url = raw; }
    console.log("[image-proxy] requested:", url);

    // set CORS so browser can load <img crossOrigin="anonymous">
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // If absolute URL points back to our server origin, convert to local path
    try {
      const serverOrigin = `${req.protocol}://${req.get("host")}`; // e.g. http://localhost:5000
      if (url.startsWith(serverOrigin)) {
        url = url.slice(serverOrigin.length);
        console.log("[image-proxy] converted to local path:", url);
      }
    } catch (e) { /* ignore */ }

    // serve local files directly
    if (url.startsWith("/uploads") || url.startsWith("uploads")) {
      const rel = url.startsWith("/") ? url.slice(1) : url;
      const filePath = path.join(__dirname, "..", rel);
      console.log("[image-proxy] local filePath:", filePath, "exists?", fs.existsSync(filePath));
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Local file not found", checkedPath: filePath });
      return res.sendFile(filePath);
    }

    // otherwise fetch external image
    if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: "Invalid url format" });

    await ensureNodeFetch();
    if (!fetchFn) return res.status(500).json({ error: "Server fetch not available" });

    const response = await fetchFn(url);
    if (!response.ok) {
      console.error("[image-proxy] external fetch failed:", response.status, url);
      return res.status(response.status).json({ error: "Failed to fetch image" });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.end(buffer);
  } catch (err) {
    console.error("[image-proxy] unexpected error:", err && (err.stack || err.message || err));
    res.status(500).json({ error: "Proxy error", message: err && (err.message || String(err)) });
  }
});

export default router;
