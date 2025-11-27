import React from "react";
import { useProducts } from "../products/ProductsContext.jsx";
import ProductCard from "./ProductCard.jsx";


const ProductGrid = () => {
  const { products } = useProducts();

  // ✅ सिर्फ़ पहले 6 products front page पर
  const visibleProducts = products.slice(0, 6);

  return (
    <div className="grid grid-cols-3 gap-x-10 gap-y-10 place-items-center mt-4 mb-16">
      {visibleProducts.map((p) => (<ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
};


export default ProductGrid;
