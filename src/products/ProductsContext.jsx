// src/products/ProductsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const ProductsContext = createContext();

const STORAGE_KEY = "sarjan-products";

const initialProducts = [
  {
    id: 1,
    model: "101",
    price: 120,
    image:
      "https://via.placeholder.com/300x350.png?text=Chair+1",
  },
  {
    id: 2,
    model: "102",
    price: 120,
    image:
      "https://via.placeholder.com/300x350.png?text=Chair+2",
  },
  {
    id: 3,
    model: "103",
    price: 120,
    image:
      "https://via.placeholder.com/300x350.png?text=Chair+3",
  },
];

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState(initialProducts);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (e) {
        console.error("Invalid products in storage");
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const addProduct = (product) => {
    setProducts((prev) => [
      ...prev,
      {
        ...product,
        id: Date.now(), // unique id
      },
    ]);
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        addProduct,
        deleteProduct,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => useContext(ProductsContext);
