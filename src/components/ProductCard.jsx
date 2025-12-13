// src/components/ProductCard.jsx
import React from "react";

export default function ProductCard({ product }) {

  const getImageUrl = (path) => {
    if (!path) return "/watermark.png";
    if (path.startsWith("http")) return path;

    // ✅ CORRECT backend base (same domain as API + uploads)
    const BASE =
      window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://sarjan-catalog.onrender.com";

    return `${BASE}/${path}`;
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="rounded-[22px] overflow-hidden border-[4px] border-[#1c3f7a] bg-white w-full shadow-md">
        <div className="w-full aspect-[3/4] bg-white">
          <img
            src={getImageUrl(product.image)}
            alt={product.model || "product"}
            className="w-full h-full object-cover select-none"
            draggable={false}
            onError={(e) => {
              e.currentTarget.src = "/watermark.png";
            }}
          />
        </div>
      </div>

      <div className="w-full text-center mt-2">
        <p className="text-[12px] font-bold text-[#0f3b6a] leading-tight">
          <span className="font-extrabold">{product.model}</span>
        </p>

        <p className="text-[12px] font-bold text-[#0f3b6a] leading-tight mt-0.5">
          ₹.<span className="font-extrabold">{product.price}</span>/-
        </p>
      </div>
    </div>
  );
}
