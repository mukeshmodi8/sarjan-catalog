import React from "react";
import { useProducts } from "../products/ProductsContext.jsx";
import ProductCard from "./ProductCard.jsx";

const ProductGrid = () => {
  const { products } = useProducts();

  const visibleProducts = products.slice(0, 9);

  return (
    <div className="grid grid-cols-3 gap-x-10 gap-y-10 place-items-center">
      {visibleProducts.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
};

export default ProductGrid;
