// src/products/ProductsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// ⚙️ Local vs Render backend
const API_BASE =
  import.meta.env.PROD
    ? "https://sarjan-backend.onrender.com/api" // Render backend
    : "http://localhost:5000/api";             // Local backend

const ProductsContext = createContext();

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // 🔹 Products laane ka function
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/products`);
      // MongoDB se _id aata hai, usko id me map kar rahe hain
      const mapped = res.data.map((p) => ({ ...p, id: p._id }));
      setProducts(mapped);
    } catch (err) {
      console.error("Fetch products error:", err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Mount pe ek baar data fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // 🔹 Add product (Admin se)
  const addProduct = async (product) => {
    try {
      const res = await axios.post(`${API_BASE}/products`, product);
      const saved = res.data;
      setProducts((prev) => [...prev, { ...saved, id: saved._id }]);
    } catch (err) {
      console.error("Add product error:", err);
      throw err;
    }
  };

  // 🔹 Update product
  const updateProduct = async (updatedProduct) => {
    try {
      const id = updatedProduct.id;
      const payload = {
        model: updatedProduct.model,
        price: updatedProduct.price,
        image: updatedProduct.image,
        stock: updatedProduct.stock,
      };
      const res = await axios.put(`${API_BASE}/products/${id}`, payload);
      const saved = res.data;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...saved, id: saved._id } : p))
      );
    } catch (err) {
      console.error("Update product error:", err);
      throw err;
    }
  };

  // 🔹 Delete product
  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${API_BASE}/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete product error:", err);
      throw err;
    }
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
        error,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => useContext(ProductsContext);
