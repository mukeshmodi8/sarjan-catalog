// src/pages/Register.jsx
import React, { useState } from "react";
import { useProducts } from "../context/ProductProvider";

export default function Register() {
  const { setView } = useProducts();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (username === "admin" || username === "test") { setError("Username already taken."); return; }
    if (password.length < 5) { setError("Password must be at least 5 characters."); return; }
    setSuccess("Registration successful! Redirecting to login...");
    setTimeout(() => setView("login"), 1500);
  };

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-xl p-8 max-w-sm w-full">
        <h4 className="text-2xl font-bold mb-6 text-center">Register as Admin</h4>
        <form onSubmit={handleRegister}>
          <div className="mb-4"><label className="block text-sm mb-1">Username</label><input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border px-3 py-2 rounded" required /></div>
          <div className="mb-4"><label className="block text-sm mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" required /></div>
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          {success && <p className="text-green-500 text-xs mb-3">{success}</p>}
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded">Register</button>
        </form>
        <p className="text-gray-500 mt-4 text-xs text-center">Already have an account? <button onClick={() => setView("login")} className="text-blue-600 ml-1">Login here</button></p>
      </div>
    </main>
  );
}
