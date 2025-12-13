// server/routes/upload.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { PassThrough } from "stream"; // <- ESM-safe stream import

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ensure uploads folder exists (local fallback)
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// read env
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD;
const CLOUD_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUD_SECRET = process.env.CLOUDINARY_API_SECRET;

// configure cloudinary properly using env variables
if (CLOUD_NAME && CLOUD_KEY && CLOUD_SECRET) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_KEY,
    api_secret: CLOUD_SECRET,
    secure: true,
  });

  console.log("Cloudinary configured:", CLOUD_NAME);
} else {
  console.log("Cloudinary not configured - using local uploads fallback.");
}

// use multer memory storage for easy streaming to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // If Cloudinary is configured -> upload to cloudinary
    if (CLOUD_NAME && CLOUD_KEY && CLOUD_SECRET) {
      // stream the buffer to cloudinary using PassThrough
      const bufferStream = new PassThrough();
      bufferStream.end(req.file.buffer);

      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "sarjan_catalog", resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        bufferStream.pipe(uploadStream);
      });

      const result = await uploadPromise;
      return res.json({
        success: true,
        imageUrl: result.secure_url,
        public_id: result.public_id,
        raw: result,
      });
    }

    // Otherwise fallback: save to local uploads folder and return absolute url
    const ext = path.extname(req.file.originalname) || ".jpg";
    const filename = Date.now() + "-" + Math.random().toString(36).slice(2, 9) + ext;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    const base = process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${base}/uploads/${filename}`;

    return res.json({ success: true, imageUrl, relative: `/uploads/${filename}`, filename });
  } catch (err) {
    console.error("upload-image error:", err && (err.message || err));
    return res.status(500).json({ error: "Upload failed", details: err?.message || String(err) });
  }
});

export default router;
