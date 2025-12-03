// routes/upload.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const router = express.Router();

// ensure uploads folder exists (relative to project root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = allowed.test(file.mimetype);
    const extOk = allowed.test(ext);
    if (mimeOk && extOk) cb(null, true);
    else cb(new Error("Only JPG/PNG images are allowed"));
  },
});

// POST /api/upload-image
router.post("/upload-image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // build public URL for the uploaded file
    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${backendUrl}/uploads/${req.file.filename}`;

    return res.json({ imageUrl });
  } catch (err) {
    console.error("Upload route error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
