// server/routes/upload.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { PassThrough } from "stream";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ensure uploads folder exists (local fallback)
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// read env
const CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD;
const CLOUD_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUD_SECRET = process.env.CLOUDINARY_API_SECRET;

// configure cloudinary
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

// multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    /* ================= CLOUDINARY ================= */
    if (CLOUD_NAME && CLOUD_KEY && CLOUD_SECRET) {
      const bufferStream = new PassThrough();
      bufferStream.end(req.file.buffer);

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "sarjan_catalog", resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        bufferStream.pipe(uploadStream);
      });

      // ✅ ONLY RELATIVE PATH (cloudinary public id)
      return res.json({
        success: true,
        imagePath: result.public_id, // save this in DB
        provider: "cloudinary",
      });
    }

    /* ================= LOCAL UPLOAD ================= */
    const ext = path.extname(req.file.originalname) || ".jpg";
    const filename =
      Date.now() + "-" + Math.random().toString(36).slice(2, 9) + ext;

    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    // ✅ ONLY RELATIVE PATH
    return res.json({
      success: true,
      imagePath: `uploads/${filename}`, // save this in DB
      provider: "local",
    });
  } catch (err) {
    console.error("upload-image error:", err?.message || err);
    return res
      .status(500)
      .json({ error: "Upload failed", details: err?.message });
  }
});

export default router;
