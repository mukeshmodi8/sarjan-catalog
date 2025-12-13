import React, { useState } from "react";
import { useProducts } from "../context/ProductProvider";

export default function Navbar() {
    const { view, setView } = useProducts();
    const [open, setOpen] = useState(false);
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const isActive = (page) => (view === page ? "text-blue-600 font-semibold" : "text-gray-700");

    return (
        <nav className="w-full bg-white shadow sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center h-14">
                    <div onClick={() => setView("home")} className="text-lg font-bold text-blue-600 tracking-wide cursor-pointer">Sarjan Catalog</div>

                    <div className="hidden md:flex items-center space-x-4">
                        <div onClick={() => setView("home")} className={`text-sm cursor-pointer ${isActive("home")}`}>Front Page</div>
                        <div onClick={() => setView("admin")} className={`text-sm cursor-pointer ${isActive("admin")}`}>Admin</div>
                        {isAdmin && <div onClick={() => setView("manage-categories")} className={`text-sm cursor-pointer ${isActive("manage-categories")}`}>Manage Categories</div>}
                        <div onClick={() => setView("register")} className={`text-sm cursor-pointer ${isActive("register")}`}>Register</div>

                        {!isAdmin ? (
                            <div onClick={() => setView("login")} className="text-sm border border-blue-500 rounded-full px-3 py-1 cursor-pointer text-blue-600">Admin Login</div>
                        ) : (
                            <button onClick={() => { localStorage.removeItem("isAdmin"); setView("login"); }} className="text-sm border border-red-500 text-red-600 rounded-full px-3 py-1 hover:bg-red-50">Logout</button>
                        )}
                    </div>

                    <button className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300" onClick={() => setOpen((p) => !p)}>
                        <span className="sr-only">Open main menu</span>
                        <div className="space-y-1.5">
                            <span className="block w-5 h-[2px] bg-gray-700"></span>
                            <span className="block w-5 h-[2px] bg-gray-700"></span>
                            <span className="block w-5 h-[2px] bg-gray-700"></span>
                        </div>
                    </button>
                </div>

                {open && (
                    <div className="md:hidden pb-3 border-t border-gray-100">
                        <div className="flex flex-col space-y-2 pt-3">
                            <div onClick={() => { setView("home"); setOpen(false); }} className={`text-sm px-2 cursor-pointer ${isActive("home")}`}>Front Page</div>
                            <div onClick={() => { setView("admin"); setOpen(false); }} className={`text-sm px-2 cursor-pointer ${isActive("admin")}`}>Admin</div>
                            {isAdmin && <div onClick={() => { setView("manage-categories"); setOpen(false); }} className={`text-sm px-2 cursor-pointer ${isActive("manage-categories")}`}>Manage Categories</div>}
                            <div onClick={() => { setView("register"); setOpen(false); }} className={`text-sm px-2 cursor-pointer ${isActive("register")}`}>Register</div>
                            {!isAdmin ? <div onClick={() => { setView("login"); setOpen(false); }} className="text-sm px-2 text-blue-600 cursor-pointer">Admin Login</div> : <div className="text-sm px-2 text-red-600 cursor-pointer" onClick={() => { localStorage.removeItem("isAdmin"); setView("login"); setOpen(false); }}>Logout</div>}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
