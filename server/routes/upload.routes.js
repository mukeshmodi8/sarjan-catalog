// server/routes/upload.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.random().toString(36).substr(2, 6) + ext;
    cb(null, name);
  },
});
const upload = multer({ storage });

router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  // Return full public URL if you want:
  const base = process.env.SERVER_URL || process.env.BASE_URL || "";
  const url = base ? `${base}/uploads/${req.file.filename}` : `/uploads/${req.file.filename}`;
  res.json({ imageUrl: url });
});

export default router;
