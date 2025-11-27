import React from "react";

const ProductCard = ({ product }) => {
  return (
    <div className="w-[150px]">

      <div className="rounded-[22px] overflow-hidden border-[4px] border-[#1c3f7a] bg-white">
      // जहां भी image है वहां h-[170px] को बदलकर:

        <img
          src={product.image}
          alt={product.model}
          className="w-full h-[150px] object-cover"   // ✅ 170 → 150
        />

      </div>

      <div className="flex justify-between mt-1 text-[11px] text-black">
        <span>
          Model No. <span className="font-semibold">{product.model}</span>
        </span>
        <span>
          Rs.<span className="font-semibold">{product.price}/-</span>
        </span>
      </div>


    </div>
  );
};

export default ProductCard;
