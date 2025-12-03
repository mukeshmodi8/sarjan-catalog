// scripts/fixImageUrls.js
// Usage:
// 1) Dry run (no save):   node scripts/fixImageUrls.js
// 2) Apply changes:       DRY_RUN=false node scripts/fixImageUrls.js
//
// Make sure your .env has MONGO_URI and server/models/Product.js path is correct.

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Product from "../server/models/Product.js"; // adjust if your model path is different

const DRY_RUN = process.env.DRY_RUN !== "false"; // default true -> safe dry-run
const FROM = "http://localhost:5000";
const TO = "https://sarjan-catalog.onrender.com";

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing in environment (.env). Aborting.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    // Find products that contain the local host URL
    const products = await Product.find({ image: { $regex: FROM } }).lean();
    console.log("Found", products.length, "products with", FROM);

    if (products.length === 0) {
      console.log("Nothing to update. Exiting.");
      process.exit(0);
    }

    for (const p of products) {
      const newUrl = p.image.replace(FROM, TO);
      console.log("ID:", p._id, "Old:", p.image);
      console.log(" → New:", newUrl);

      if (!DRY_RUN) {
        // Update in DB
        await Product.updateOne({ _id: p._id }, { $set: { image: newUrl } });
        console.log("   Updated in DB");
      } else {
        console.log("   (dry-run) not saved");
      }
    }

    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    // mongoose.disconnect is optional since process exits, but keep for cleanliness
    try { await mongoose.disconnect(); } catch (e) {}
  }
}

run();
