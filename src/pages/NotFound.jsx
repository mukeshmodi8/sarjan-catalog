// src/pages/NotFound.jsx
import React from "react";
import { useProducts } from "../context/ProductProvider";

export default function NotFound() {
  const { setView } = useProducts();
  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-gray-100 p-4">
      <div className="text-center p-10 bg-white shadow-lg rounded-xl">
        <h1 className="text-6xl font-extrabold text-gray-800">404</h1>
        <p className="text-xl text-gray-600 mt-2">Page not found.</p>
        <button onClick={() => setView("home")} className="mt-5 px-4 py-2 bg-indigo-500 text-white rounded">Back to Home</button>
      </div>
    </main>
  );
}
