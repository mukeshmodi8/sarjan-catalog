// src/App.jsx
import React from "react";
import { ProductProvider, useProducts } from "./context/ProductProvider";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./components/AdminDashboard";
import ManageCategoriesPage from "./components/ManageCategoriesPage";

function AppContent() {
  const { view } = useProducts();
  switch (view) {
    case "admin": return <AdminDashboard />;
    case "login": return <Login />;
    case "register": return <Register />;
    case "home": return <Home />;
    case "manage-categories": return <ManageCategoriesPage />;
    default: return <NotFound />;
  }
}

export default function App() {
  return (
    <ProductProvider>
      <Navbar />
      <AppContent />
      <Toast />
    </ProductProvider>
  );
}
