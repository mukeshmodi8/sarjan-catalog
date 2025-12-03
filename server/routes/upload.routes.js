// server/routes/upload.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ensure uploads folder exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = Date.now() + "-" + Math.random().toString(36).substr(2, 6) + ext;
    cb(null, name);
  },
});
const upload = multer({ storage });

router.post("/upload-image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Prefer SERVER_URL env (set to http://yourdomain:5000), fallback to BASE_URL, fallback to build from request
    const base = process.env.SERVER_URL || process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    // Always return absolute URL (helps client & html2canvas)
    const imageUrl = `${base}/uploads/${req.file.filename}`;

    // Also return relative path optionally
    const relative = `/uploads/${req.file.filename}`;

    return res.json({
      success: true,
      imageUrl,
      relative,
      filename: req.file.filename,
    });
  } catch (err) {
    console.error("upload-image error:", err && (err.message || err));
    return res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
