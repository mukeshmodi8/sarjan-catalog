// src/components/ProductModal.jsx
import React, { useEffect, useState } from "react";
import { useProducts } from "../context/ProductProvider";

export default function ProductModal({ isOpen, onClose, editingProduct }) {
  const { addProduct, updateProduct, showToast } = useProducts();
  const [form, setForm] = useState({ model: "", price: "", image: "", stock: 0 });

  useEffect(() => {
    if (editingProduct) setForm(editingProduct);
    else setForm({ model: "", price: "", image: "", stock: 0 });
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === "price" || name === "stock" ? Number(value) : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.model || !form.price || !form.image) { showToast("Please fill all required fields.", "error"); return; }
    if (editingProduct) updateProduct(form); else addProduct(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-2xl font-bold mb-4">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Model</label>
            <input name="model" value={form.model} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
          </div>
          <div>
            <label className="text-sm">Price</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
          </div>
          <div className="col-span-2">
            <label className="text-sm">Image URL</label>
            <input name="image" value={form.image} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
          </div>
          <div>
            <label className="text-sm">Stock</label>
            <input name="stock" type="number" value={form.stock} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
          </div>

          <div className="col-span-2 flex justify-end gap-2 mt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">{editingProduct ? "Save" : "Add"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
