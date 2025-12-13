// src/context/ProductProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const getApiBase = () => {
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000/api";
  }
  return "https://sarjan-catalog.onrender.com/api";
};

export const API_BASE = getApiBase();
const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sarjan_categories")) || []; } catch { return []; }
  });
  const [filters, setFilters] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sarjan_filters")) || { category: "", subcategory: "" }; } catch { return { category: "", subcategory: "" }; }
  });
  const [toast, setToast] = useState({ message: "", type: "" });
  const [view, setView] = useState("home");
  const [loading, setLoading] = useState(false);

  const persistCategories = (next) => {
    setCategories(next);
    try { localStorage.setItem("sarjan_categories", JSON.stringify(next)); } catch {}
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const syncCategoriesFromProducts = (prods) => {
    let next = [...categories];
    let changed = false;
    prods.forEach((p) => {
      if (!p.category) return;
      let cat = next.find((c) => c.name === p.category);
      if (!cat) {
        cat = { id: `${p.category}-${Date.now()}`, name: p.category, sub: [] };
        next.push(cat);
        changed = true;
      }
      if (p.subcategory) {
        if (!cat.sub.some((s) => s.name === p.subcategory)) {
          cat.sub.push({ id: `${p.category}-${p.subcategory}-${Date.now()}`, name: p.subcategory });
          changed = true;
        }
      }
    });
    if (changed) persistCategories(next);
  };

  useEffect(() => {
    try { localStorage.setItem("sarjan_filters", JSON.stringify(filters)); } catch {}
  }, [filters]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/products`);
        const mapped = (res.data || []).map((p) => ({ ...p, id: p._id || p.id }));
        setProducts(mapped);
        syncCategoriesFromProducts(mapped);
      } catch (err) {
        console.error("Fetch products error:", err);
        showToast("Failed to load products.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  // CRUD
  const addProduct = async (product) => {
    try {
      const res = await axios.post(`${API_BASE}/products`, product);
      const saved = res.data;
      setProducts((prev) => [...prev, { ...saved, id: saved._id || saved.id }]);
      syncCategoriesFromProducts([saved]);
      showToast("Product added.", "success");
    } catch (err) {
      console.error("Add product error:", err);
      showToast("Failed to add product.", "error");
    }
  };

  const updateProduct = async (p) => {
    try {
      const res = await axios.put(`${API_BASE}/products/${p.id}`, p);
      const saved = res.data;
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...saved, id: saved._id || saved.id } : x)));
      syncCategoriesFromProducts([saved]);
      showToast("Product updated.", "success");
    } catch (err) {
      console.error("Update product error:", err);
      showToast("Failed to update product.", "error");
    }
  };

  const deleteProduct = async (id) => {
    const productToDelete = products.find((p) => p.id === id);
    if (!productToDelete) return;
    if (!window.confirm(`Are you sure you want to delete Model No. ${productToDelete.model}?`)) return;
    try {
      await axios.delete(`${API_BASE}/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("Product removed.", "error");
    } catch (err) {
      console.error("Delete product error:", err);
      showToast("Failed to delete product.", "error");
    }
  };

  // categories
  const addCategory = (name) => {
    if (!name) return;
    if (categories.find((c) => c.name === name)) { showToast("Category already exists.", "error"); return; }
    const next = [...categories, { id: Date.now().toString(), name, sub: [] }];
    persistCategories(next);
    showToast("Category added.", "success");
  };
  const deleteCategory = (id) => { persistCategories(categories.filter((c) => c.id !== id)); showToast("Category removed.", "error"); };
  const addSubcategory = (catId, subName) => {
    if (!subName) return;
    const next = categories.map((c) => (c.id === catId ? { ...c, sub: [...c.sub, { id: Date.now().toString(), name: subName }] } : c));
    persistCategories(next);
    showToast("Subcategory added.", "success");
  };
  const deleteSubcategory = (catId, subId) => { persistCategories(categories.map((c) => (c.id === catId ? { ...c, sub: c.sub.filter((s) => s.id !== subId) } : c))); showToast("Subcategory removed.", "error"); };

  const value = useMemo(() => ({
    products, addProduct, updateProduct, deleteProduct,
    categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory,
    filters, setFilters, toast, showToast, view, setView, loading
  }), [products, categories, filters, toast, view, loading]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProducts = () => useContext(ProductContext);
