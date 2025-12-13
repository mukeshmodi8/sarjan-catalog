// src/components/AddProduct.jsx
import React, { useState } from "react";
import { API_BASE, useProducts } from "../context/ProductProvider";

export default function AddProduct() {
  const { addProduct, showToast, categories } = useProducts();
  const [form, setForm] = useState({ model: "", price: "", image: "", stock: 0, category: "", subcategory: "" });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") setForm((p) => ({ ...p, category: value, subcategory: "" }));
    else setForm((p) => ({ ...p, [name]: value }));
  };

const handleImageUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("image", file);

  try {
    setUploading(true); 
    const res = await fetch(`${API_BASE}/upload-image`, { method: "POST", body: fd });
    const data = await res.json();

    if (data.imageUrl) {
      setForm((p) => ({ ...p, image: data.imageUrl })); // preview + DB use this
      showToast?.("Image uploaded successfully!", "success");
    } else if (data.relative) {
      setForm((p) => ({ ...p, image: data.relative }));
      showToast?.("Image uploaded (relative).", "success");
    } else {
      console.error("Upload response:", data);
      showToast?.("Upload failed (see console)", "error");
    }
  } catch (err) {
    console.error("upload error:", err);
    showToast?.("Image upload failed.", "error");
  } finally {
    setUploading(false);
  }
};


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.model || !form.price || !form.image) { showToast("Please fill all required fields.", "error"); return; }
    addProduct({ model: form.model, price: Number(form.price), image: form.image, stock: Number(form.stock) || 0, category: form.category || "", subcategory: form.subcategory || "" });
    setForm({ model: "", price: "", image: "", stock: 0, category: "", subcategory: "" });
  };

  const availableSubcats = (categories.find((c) => c.name === form.category)?.sub || []).map(s => s.name) || [];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Add New Product (UPLOAD)</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
        <div><label className="text-sm">Name</label><input name="model" value={form.model} onChange={handleChange} className="w-full border px-3 py-2 rounded" required /></div>
        <div><label className="text-sm">Price</label><input name="price" type="number" value={form.price} onChange={handleChange} className="w-full border px-3 py-2 rounded" required /></div>
        <div><label className="text-sm">Stock</label><input name="stock" type="number" value={form.stock} onChange={handleChange} className="w-full border px-3 py-2 rounded" /></div>
        <div><label className="text-sm">Category</label><select name="category" value={form.category} onChange={handleChange} className="w-full border px-3 py-2 rounded"><option value="">Select category (optional)</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>

        <div className="md:col-span-3">
          <label className="text-sm">Image URL</label>
          <input name="image" value={form.image} onChange={handleChange} className="w-full border px-3 py-2 rounded" placeholder="Auto-filled after upload or paste manual URL" required />
          <div className="mt-2 flex items-center gap-4">
            <label className="cursor-pointer text-sm text-indigo-600 border border-dashed px-3 py-1 rounded">
              {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
            {form.image && <img src={form.image.startsWith("/") ? `${API_BASE.replace(/\/api$/, "")}${form.image}` : form.image} alt="preview" style={{ width: 100 }} />}
          </div>
        </div>

        <div className="md:col-span-1 flex items-end justify-end">
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded">+ Save New Product</button>
        </div>
      </form>
    </div>
  );
}
