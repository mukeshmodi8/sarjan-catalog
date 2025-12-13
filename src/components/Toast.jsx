// src/components/Toast.jsx
import React from "react";
import { useProducts } from "../context/ProductProvider";

export default function Toast() {
  const { toast } = useProducts();
  if (!toast?.message) return null;
  const style = toast.type === "error" ? "bg-red-600" : "bg-green-500";
  return (
    <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white z-50 ${style}`}>
      {toast.message}
    </div>
  );
}
