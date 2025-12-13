// src/components/ProductList.jsx
import React, { useState } from "react";
import { useProducts } from "../context/ProductProvider";
import ProductModal from "./ProductModal";

export default function ProductList() {
  const { products, deleteProduct } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const openEdit = (p) => { setEditingProduct(p); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-8 border border-gray-200 overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4">All Products</h2>
      {products.length === 0 ? <p>No products yet.</p> : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th>#</th><th>Preview</th><th>Model</th><th>Price</th><th className="hidden sm:table-cell">Stock</th><th className="hidden lg:table-cell">Image URL</th><th></th>
          </tr></thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">{i + 1}</td>
                <td className="px-4 py-4"><img src={p.image} alt={p.model} className="w-16 h-16 object-cover rounded" /></td>
                <td className="px-4 py-4 font-semibold">{p.model}</td>
                <td className="px-4 py-4">Rs. {p.price}</td>
                <td className="px-4 py-4 hidden sm:table-cell">{p.stock}</td>
                <td className="px-4 py-4 hidden lg:table-cell truncate max-w-xs">{p.image}</td>
                <td className="px-4 py-4 text-right">
                  <button onClick={() => openEdit(p)} className="text-indigo-600 px-3">Edit</button>
                  <button onClick={() => deleteProduct(p.id)} className="text-red-600 px-3">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ProductModal isOpen={isModalOpen} onClose={closeModal} editingProduct={editingProduct} />
    </div>
  );
}
