// src/components/ManageCategoriesPage.jsx
import React, { useEffect, useState } from "react";
import { useProducts } from "../context/ProductProvider";
import CategoriesManager from "./CategoriesManager";

export default function ManageCategoriesPage() {
  const { categories, products, addProduct, showToast } = useProducts();
  const [newCategory, setNewCategory] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [newSub, setNewSub] = useState("");
  const [pForm, setPForm] = useState({ model: "", price: "", image: "", stock: 0, category: "", subcategory: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const cat = categories.find((c) => c.id === selectedCatId);
    setPForm((prev) => ({ ...prev, category: cat ? cat.name : "", subcategory: "" }));
  }, [selectedCatId, categories]);

  const handlePChange = (e) => { const { name, value } = e.target; setPForm((p) => ({ ...p, [name]: value })); };

  const handleAddProductToCategory = (e) => {
    e.preventDefault();
    if (!pForm.model || !pForm.price || !pForm.image) return showToast("Fill model, price and image.", "error");
    const catName = pForm.category || (categories.find(c => c.id === selectedCatId)?.name) || "";
    addProduct({ model: pForm.model, price: Number(pForm.price), image: pForm.image, stock: Number(pForm.stock) || 0, category: catName, subcategory: pForm.subcategory || "" });
    setPForm({ model: "", price: "", image: "", stock: 0, category: catName, subcategory: "" });
    showToast("Product added to category.", "success");
  };

  const productsInCat = selectedCatId ? products.filter((p) => p.category === (categories.find(c => c.id === selectedCatId)?.name)) : [];

  return (
    <main className="min-h-[calc(100vh-56px)] p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Manage Categories</h2>
          <p className="text-sm text-gray-500">Create categories & add products directly into them.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-3">Categories</h3>
            {categories.length === 0 ? <p>No categories yet.</p> : categories.map((c) => (
              <div key={c.id} className={`p-2 rounded flex justify-between items-center mb-2 ${selectedCatId === c.id ? "bg-blue-50" : ""}`}>
                <div><div className="font-medium">{c.name}</div><div className="text-xs text-gray-500">{c.sub.length ? c.sub.map(s => s.name).join(", ") : "— no subcategories"}</div></div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedCatId(c.id)} className="text-blue-600">Open</button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-3">Selected Category</h3>
            {selectedCatId ? (
              <>
                <div className="mb-3"><div className="text-lg font-medium">{categories.find(c => c.id === selectedCatId)?.name}</div></div>
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="New subcategory name" className="px-3 py-2 border rounded w-full" />
                    {/* sub add button uses CategoriesManager via context; for brevity leave direct use */}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Add product to this category</h4>
                  <form onSubmit={handleAddProductToCategory} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input name="model" value={pForm.model} onChange={handlePChange} placeholder="Model name" className="px-3 py-2 border rounded" />
                      <input name="price" type="number" value={pForm.price} onChange={handlePChange} placeholder="Price" className="px-3 py-2 border rounded" />
                      <input name="stock" type="number" value={pForm.stock} onChange={handlePChange} placeholder="Stock" className="px-3 py-2 border rounded" />
                      <select name="subcategory" value={pForm.subcategory} onChange={handlePChange} className="px-3 py-2 border rounded">
                        <option value="">Select subcategory (optional)</option>
                        {(categories.find(c => c.id === selectedCatId)?.sub || []).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer text-sm text-indigo-600 border border-dashed px-3 py-1 rounded">
                          Upload Image
                          <input type="file" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append("image", file);
                            setUploading(true);
                            try {
                              const res = await fetch(`${API_BASE}/upload-image`, { method: "POST", body: fd });
                              const data = await res.json();
                              if (data.imageUrl) { setPForm(prev => ({ ...prev, image: data.imageUrl })); showToast("Image uploaded!", "success"); }
                              else if (data.relative) { setPForm(prev => ({ ...prev, image: data.relative })); showToast("Image uploaded (relative).", "success"); }
                              else showToast("Upload failed.", "error");
                            } catch (err) { console.error(err); showToast("Upload failed.", "error"); } finally { setUploading(false); }
                          }} />
                        </label>
                        <input name="image" value={pForm.image} onChange={handlePChange} placeholder="Or paste image URL" className="px-3 py-2 border rounded w-full" />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Add Product</button>
                    </div>
                  </form>
                </div>
              </>
            ) : <p>Select a category from the left to manage it.</p>}
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-3">Products in category</h3>
            {selectedCatId ? (
              productsInCat.length === 0 ? <p>No products in this category yet.</p> : productsInCat.map((p) => (
                <div key={p.id} className="p-2 border rounded flex items-center gap-3 mb-2">
                  <img src={p.image} alt={p.model} className="w-12 h-12 object-cover rounded" />
                  <div><div className="font-medium">{p.model}</div><div className="text-xs text-gray-500">₹{p.price} • Stock: {p.stock}</div></div>
                </div>
              ))
            ) : <p>Select a category to view its products.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
