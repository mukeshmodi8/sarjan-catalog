// src/components/ProductCard.jsx
import React from "react";

export default function ProductCard({ product }) {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="rounded-[22px] overflow-hidden border-[4px] border-[#1c3f7a] bg-white w-full shadow-md">
        <div className="w-full aspect-[3/4]">
          <img src={product.image ? product.image : "/watermark.png"} alt={product.model || "product"} className="w-full h-full object-cover select-none" draggable={false} />
        </div>
      </div>

      <div className="w-full text-center mt-2">
        <p className="text-[12px] font-bold text-[#0f3b6a] leading-tight"><span className="font-extrabold">{product.model}</span></p>
        <p className="text-[12px] font-bold text-[#0f3b6a] leading-tight mt-0.5">₹.<span className="font-extrabold">{product.price}</span>/-</p>

        {(product.category || product.subcategory) && (
          <p className="text-[11px] text-gray-600 mt-1 font-medium">{product.category}{product.category && product.subcategory ? " • " : ""}{product.subcategory}</p>
        )}
      </div>
    </div>
  );
}
