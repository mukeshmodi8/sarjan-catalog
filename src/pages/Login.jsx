// src/pages/Login.jsx
import React, { useState } from "react";
import { useProducts } from "../context/ProductProvider";

const ADMIN_EMAIL = "admin123@gmail.com";
const ADMIN_PASSWORD = "123456";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setView } = useProducts();
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("isAdmin", "true");
      setView("admin");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-xl p-8 max-w-sm w-full">
        <h4 className="text-2xl font-bold mb-6 text-center">Admin Login</h4>
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="block text-sm mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" placeholder="Enter Admin email" /></div>
          <div className="mb-4"><label className="block text-sm mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" placeholder="Enter Admin password" /></div>
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
        </form>
      </div>
    </main>
  );
}
