// src/components/CategoriesManager.jsx
import React, { useState } from "react";
import { useProducts } from "../context/ProductProvider";

export default function CategoriesManager() {
  const { categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory } = useProducts();
  const [catName, setCatName] = useState("");
  const [subName, setSubName] = useState("");
  const [selectedCat, setSelectedCat] = useState("");

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Categories Manager</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input placeholder="New category name" value={catName} onChange={(e) => setCatName(e.target.value)} className="border rounded px-3 py-2" />
        <button onClick={() => { if (catName.trim()) { addCategory(catName.trim()); setCatName(""); } }} className="bg-indigo-600 text-white px-4 rounded">Add Category</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center mb-4">
        <select className="border rounded px-3 py-2" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input placeholder="New subcategory name" value={subName} onChange={(e) => setSubName(e.target.value)} className="border rounded px-3 py-2" />
        <button onClick={() => { if (selectedCat && subName.trim()) { addSubcategory(selectedCat, subName.trim()); setSubName(""); } }} className="bg-green-600 text-white px-4 rounded">Add Subcategory</button>
      </div>

      <div>
        {categories.length === 0 ? <p>No categories yet.</p> : categories.map((c) => (
          <div key={c.id} className="p-3 border rounded mb-2">
            <div className="flex justify-between items-center">
              <div><div className="font-medium">{c.name}</div><div className="text-xs text-gray-500 mt-1">{c.sub.length ? c.sub.map(s => s.name).join(", ") : "— no subcategories"}</div></div>
              <div className="flex gap-2">
                <button onClick={() => deleteCategory(c.id)} className="text-red-600">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
