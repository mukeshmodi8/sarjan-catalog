// src/components/AdminDashboard.jsx
import React, { useEffect } from "react";
import { useProducts } from "../context/ProductProvider";
import AddProduct from "./AddProduct";
import ProductList from "./ProductList";
import CatalogView from "./CatalogView";

export default function AdminDashboard() {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const { setView } = useProducts();

  useEffect(() => {
    if (!isAdmin) setView("login");
  }, [isAdmin, setView]);

  if (!isAdmin) return null;

  return (
    <main className="py-4 bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 max-w-7xl">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold">Admin Panel ⚙️</h1>
            <p className="text-lg text-gray-500 mt-2">Manage all products in your catalog.</p>
          </div>
        </header>

        <AddProduct />
        <ProductList />
      </div>
      <CatalogView />
    </main>
  );
}
