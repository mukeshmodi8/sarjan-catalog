import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import React, { useState, useContext, createContext, useMemo, useEffect } from "react";
import axios from "axios";

// 먼저 API_BASE 선언
const getApiBase = () => {
    if (
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1")
    ) {
        return "http://localhost:5000/api";
    }
    return "https://sarjan-catalog.onrender.com/api";
};

const API_BASE = getApiBase();
const IMAGE_PROXY_BASE = API_BASE;
const ADMIN_EMAIL = "admin123@gmail.com";
const ADMIN_PASSWORD = "123456";

const WATERMARK_URL = "/watermark.png";


const ProductContext = createContext();



const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [toast, setToast] = useState({ message: "", type: "", id: null });
    const [view, setView] = useState("home");
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState(() => {
        try {
            const raw = localStorage.getItem("sarjan_filters");
            return raw ? JSON.parse(raw) : { category: "", subcategory: "" };
        } catch {
            return { category: "", subcategory: "" };
        }
    });


    const [categories, setCategories] = useState(() => {
        try {
            const raw = localStorage.getItem("sarjan_categories");
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    const persistCategories = (next) => {
        setCategories(next);
        localStorage.setItem("sarjan_categories", JSON.stringify(next));
    };

    // toast helper unchanged
    const showToast = (message, type = "success") => {
        setToast({ message, type, id: Date.now() });
        setTimeout(() => setToast({ message: "", type: "", id: null }), 3000);
    };
    useEffect(() => {
        try {
            localStorage.setItem("sarjan_filters", JSON.stringify(filters));
        } catch (e) {
            console.warn("Failed to persist filters", e);
        }
    }, [filters]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE}/products`);
                const mapped = res.data.map((p) => ({ ...p, id: p._id }));
                setProducts(mapped);
            } catch (err) {
                console.error("Fetch products error:", err?.message || err);
                showToast("Failed to load products.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Category helpers (client-side)
    const addCategory = (name) => {
        if (!name) return;
        if (categories.find((c) => c.name === name)) {
            showToast("Category already exists.", "error");
            return;
        }
        const next = [...categories, { id: Date.now().toString(), name, sub: [] }];
        persistCategories(next);
        showToast("Category added.", "success");
    };
    // ------------ add this inside ProductProvider (near updateProduct) ------------
    const addProduct = async (product) => {
        try {
            const res = await axios.post(`${API_BASE}/products`, product);
            const saved = res.data;
            // ensure saved has _id from server
            setProducts((prev) => [...prev, { ...saved, id: saved._id }]);
            showToast(`Product ${product.model} added successfully.`, "success");
        } catch (err) {
            console.error("Add product error:", err?.message || err);
            showToast("Failed to add product.", "error");
        }
    };
    // -----------------------------------------------------------------------------


    const deleteCategory = (id) => {
        const next = categories.filter((c) => c.id !== id);
        persistCategories(next);
        showToast("Category removed.", "error");
    };

    const addSubcategory = (catId, subName) => {
        if (!subName) return;
        const next = categories.map((c) =>
            c.id === catId ? { ...c, sub: [...c.sub, { id: Date.now().toString(), name: subName }] } : c
        );
        persistCategories(next);
        showToast("Subcategory added.", "success");
    };

    const deleteSubcategory = (catId, subId) => {
        const next = categories.map((c) =>
            c.id === catId ? { ...c, sub: c.sub.filter((s) => s.id !== subId) } : c
        );
        persistCategories(next);
        showToast("Subcategory removed.", "error");
    };

    // add / update / delete product unchanged except ensure category/subcategory preserved
    const ProductCard = ({ product }) => {
        return (
            <div className="w-full flex flex-col items-center">
                <div className="relative rounded-[22px] overflow-hidden border-[4px] border-[#1c3f7a] bg-white w-full shadow-md">
                    <div className="w-full aspect-[3/4]">
                        <img
                            src={resolveImageUrl(product.image)}
                            alt={product.model}
                            className="w-full h-full object-cover block"
                            draggable={false}
                        />
                    </div>

                    {/* Watermark overlay */}
                    <img
                        src={WATERMARK_URL}
                        alt="watermark"
                        draggable={false}
                        className="pointer-events-none select-none absolute right-2 bottom-2 opacity-80"
                        style={{
                            width: "28%",         // tweak as needed
                            maxWidth: "120px",
                            mixBlendMode: "normal" // or "multiply" if you prefer darker overlay
                        }}
                    />
                </div>

                {/* Model + Price */}
                <div className="w-full text-center mt-2">
                    <p className="text-[12px] font-bold text-[#0f3b6a] leading-tight">
                        <span className="font-extrabold">{product.model}</span>
                    </p>

                    <p className="text-[12px] font-bold text-[#0f3b6a] leading-tight mt-0.5">
                        ₹.<span className="font-extrabold">{product.price}</span>/-</p>

                    {(product.category || product.subcategory) && (
                        <p className="text-[11px] text-gray-600 mt-1 font-medium">
                            {product.category || ""}{product.category && product.subcategory ? " • " : ""}{product.subcategory || ""}
                        </p>
                    )}
                </div>
            </div>
        );
    };



    const updateProduct = async (updatedProduct) => {
        try {
            const id = updatedProduct.id;

            const payload = {
                model: updatedProduct.model,
                price: updatedProduct.price,
                image: updatedProduct.image,
                stock: updatedProduct.stock,
                // include category/subcategory (if present)
                category: updatedProduct.category || "",
                subcategory: updatedProduct.subcategory || "",
            };

            const res = await axios.put(`${API_BASE}/products/${id}`, payload);
            const saved = res.data;

            setProducts((prev) =>
                prev.map((p) => (p.id === id ? { ...saved, id: saved._id } : p))
            );

            showToast(`Product ${updatedProduct.model} updated.`);
        } catch (err) {
            console.error("Update product error:", err?.message || err);
            showToast("Failed to update product.", "error");
        }
    };

    const deleteProduct = async (id) => {
        const productToDelete = products.find((p) => p.id === id);
        if (!productToDelete) return;

        if (
            !window.confirm(
                `Are you sure you want to delete Model No. ${productToDelete.model}?`
            )
        ) {
            return;
        }

        try {
            await axios.delete(`${API_BASE}/products/${id}`);
            setProducts((prev) => prev.filter((p) => p.id !== id));
            showToast(`Product ${productToDelete.model} removed.`, "error");
        } catch (err) {
            console.error("Delete product error:", err?.message || err);
            showToast("Failed to delete product.", "error");
        }
    };

    const contextValue = useMemo(
        () => ({
            products,
            addProduct,
            updateProduct,
            deleteProduct,
            showToast,
            toast,
            view,
            setView,
            loading,
            categories,
            addCategory,
            deleteCategory,
            addSubcategory,
            deleteSubcategory,
            filters,
            setFilters,
        }),
        [products, toast, view, loading, categories, filters]
    );

    return (
        <ProductContext.Provider value={contextValue}>
            {children}
        </ProductContext.Provider>
    );
};


const useProducts = () => useContext(ProductContext);

const resolveImageUrl = (url) => {
    if (!url) return url;
    // If relative uploads path (starts with /uploads) -> point to server origin
    if (url.startsWith("/uploads")) {
        const serverOrigin = API_BASE.replace(/\/api$/, "");
        return `${serverOrigin}${url}`;
    }
    // if url already absolute (http/https) return as is
    return url;
};

const Toast = () => {
    const { toast } = useProducts();
    if (!toast.message) return null;

    const baseStyle =
        "fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white transition-opacity duration-300 z-[100]";
    const style = toast.type === "error" ? "bg-red-600" : "bg-green-500";

    return <div className={`${baseStyle} ${style}`}>{toast.message}</div>;
};

const Navbar = () => {
    const { view, setView } = useProducts();
    const [open, setOpen] = useState(false);

    const isAdmin = localStorage.getItem("isAdmin") === "true";

    const handleLogout = () => {
        localStorage.removeItem("isAdmin");
        setView("login");
        setOpen(false);
    };

    const isActive = (page) =>
        view === page ? "text-blue-600 font-semibold" : "text-gray-700";

    const handleNavClick = (page) => {
        setView(page);
        setOpen(false);
    };

    return (
        <nav className="w-full bg-white shadow sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center h-14">
                    <div
                        onClick={() => handleNavClick("home")}
                        className="text-lg font-bold text-blue-600 tracking-wide cursor-pointer"
                    >
                        Sarjan Catalog
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        <div
                            onClick={() => handleNavClick("home")}
                            className={`text-sm cursor-pointer ${isActive("home")}`}
                        >
                            Front Page
                        </div>

                        <div
                            onClick={() => handleNavClick("admin")}
                            className={`text-sm cursor-pointer ${isActive("admin")}`}
                        >
                            Admin
                        </div>
                        {isAdmin && (
                            <div
                                onClick={() => handleNavClick("manage-categories")}
                                className={`text-sm cursor-pointer ${isActive("manage-categories")}`}
                            >
                                Manage Categories
                            </div>
                        )}



                        <div
                            onClick={() => handleNavClick("register")}
                            className={`text-sm cursor-pointer ${isActive("register")}`}
                        >
                            Register
                        </div>

                        {!isAdmin ? (
                            <div
                                onClick={() => handleNavClick("login")}
                                className={`text-sm border border-blue-500 rounded-full px-3 py-1 cursor-pointer ${view === "login"
                                    ? "bg-blue-500 text-white"
                                    : "text-blue-600 hover:bg-blue-50"
                                    }`}
                            >
                                Admin Login
                            </div>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="text-sm border border-red-500 text-red-600 rounded-full px-3 py-1 hover:bg-red-50"
                            >
                                Logout
                            </button>
                        )}
                    </div>

                    <button
                        className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300"
                        onClick={() => setOpen((prev) => !prev)}
                    >
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
                            <div onClick={() => handleNavClick("home")} className={`text-sm px-2 cursor-pointer ${isActive("home")}`}>Front Page</div>
                            <div onClick={() => handleNavClick("admin")} className={`text-sm px-2 cursor-pointer ${isActive("admin")}`}>Admin</div>

                            {/* show manage-categories link only if admin */}
                            {isAdmin && (
                                <div onClick={() => handleNavClick("manage-categories")} className={`text-sm px-2 cursor-pointer ${isActive("manage-categories")}`}>
                                    Manage Categories
                                </div>
                            )}

                            <div onClick={() => handleNavClick("register")} className={`text-sm px-2 cursor-pointer ${isActive("register")}`}>Register</div>

                            {!isAdmin ? (
                                <div onClick={() => handleNavClick("login")} className="text-sm px-2 text-blue-600 cursor-pointer">Admin Login</div>
                            ) : (
                                <button onClick={handleLogout} className="text-sm px-2 text-red-600 text-left">Logout</button>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </nav>
    );
};

const CatalogView = () => {
    const { products } = useProducts();

    return (
        <div id="catalog-page" className="sr-only">
            <div className="w-[595px] h-fit p-10 bg-white flex flex-col items-center relative">
                <div className="text-center mb-8 w-full">
                    <h1 className="text-[34px] font-bold tracking-wider text-[#003b7a] leading-[1] inline-block">
                        Sarjan<span className="text-sm align-super">®</span>
                    </h1>
                    <p className="text-[11px] tracking-[2px] text-gray-700 uppercase mb-6">
                        The Creation Of Creativity
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-x-8 gap-y-10 place-items-center w-full">
                    {products.map((p) => (
                        <div key={p.id} className="w-[150px] flex flex-col items-center">
                            <div className="rounded-[22px] overflow-hidden border-[4px] border-[#1c3f7a] bg-white shadow-md">
                                <img
                                    src={resolveImageUrl(p.image)}
                                    alt={p.model}
                                    className="w-full h-[170px] object-cover"
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-[11px] text-black w-full px-1">
                                <span className="text-left">
                                    Model No. <span className="font-semibold">{p.model}</span>
                                </span>
                                <span className="text-right">
                                    Rs.<span className="font-semibold">{p.price}/-</span>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-[#003b7a] text-white flex justify-between items-center px-10 py-1 text-[13px] w-[595px] mt-10">
                    <span>📞 +91 9898803407</span>
                    <span>🌍 www.sarjanindustries.com</span>
                </div>
            </div>
        </div>
    );
};

const DownloadPdf = ({ productsToExport, selectedCategory, selectedSub }) => {
    const { products: allProducts, showToast } = useProducts();
    const [isGenerating, setIsGenerating] = useState(false);

    const [preset, setPreset] = useState("3x3");
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);

    const effectiveProducts = productsToExport ?? allProducts;

    const computeItemsPerPage = () => {
        if (preset === "3x3") return 9;
        if (preset === "4x4") return 16;
        return Number(rows) * Number(cols) || 9;
    };

    const handleDownload = async () => {
        try {
            if (!effectiveProducts || effectiveProducts.length === 0) {
                showToast?.("No products to export.", "error");
                return;
            }

            setIsGenerating(true);
            const itemsPerPage = computeItemsPerPage();
            const chunks = [];
            for (let i = 0; i < effectiveProducts.length; i += itemsPerPage) {
                chunks.push(effectiveProducts.slice(i, i + itemsPerPage));
            }

            const fetchWatermarkDataUrl = async () => {
                try {
                    const resp = await fetch(WATERMARK_URL, { mode: "cors" });
                    if (!resp.ok) return null;
                    const blob = await resp.blob();
                    return await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (err) {
                    console.warn("Watermark fetch error:", err);
                    return null;
                }
            };

            const watermarkDataUrl = await fetchWatermarkDataUrl();
            if (!watermarkDataUrl) {
                console.warn("Watermark data URL not available, fallback to WATERMARK_URL");
            }

            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const columns =
                preset === "3x3" ? 3 :
                    preset === "4x4" ? 4 :
                        Number(cols) || 3;

            for (let pageIndex = 0; pageIndex < chunks.length; pageIndex++) {
                const pageItems = chunks[pageIndex];

                if (pageIndex > 0) pdf.addPage();

                const wrapper = document.createElement("div");
                wrapper.style.width = "595px";
                wrapper.style.padding = "28px";
                wrapper.style.background = "#fff";
                wrapper.style.boxSizing = "border-box";
                wrapper.style.position = "fixed";
                wrapper.style.left = "-9999px";
                wrapper.style.top = "0";
                wrapper.style.zIndex = "99999";
                wrapper.style.fontFamily = "Arial, Helvetica, sans-serif";

                // 🔹 HEADER + CATEGORY TITLE
                const header = document.createElement("div");
                header.innerHTML = `
                    <h1 style="margin:0;font-size:34px;color:#003b7a;text-align:center;font-weight:700;">
                        Sarjan<span style="font-size:12px;vertical-align:super">®</span>
                    </h1>
                    <p style="margin:6px 0 6px;text-align:center;font-size:11px;color:#666;letter-spacing:2px">
                        The Creation Of Creativity
                    </p>
                    ${selectedCategory
                        ? `<p style="margin:0 0 18px;text-align:center;font-size:12px;color:#0f3b6a;font-weight:700;">
                                 ${selectedCategory}${selectedSub ? " • " + selectedSub : ""}
                               </p>`
                        : ""
                    }
                `;
                wrapper.appendChild(header);

                const grid = document.createElement("div");
                grid.style.display = "grid";
                grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
                grid.style.gap = "12px";

                const serverOrigin = IMAGE_PROXY_BASE.replace(/\/api$/, "");

                pageItems.forEach((p) => {
                    const card = document.createElement("div");
                    card.style.display = "flex";
                    card.style.flexDirection = "column";
                    card.style.alignItems = "center";
                    card.style.position = "relative";

                    const imgWrap = document.createElement("div");
                    imgWrap.style.width = "100%";
                    imgWrap.style.aspectRatio = "3/4";
                    imgWrap.style.overflow = "hidden";
                    imgWrap.style.borderRadius = "18px";
                    imgWrap.style.border = "4px solid #1c3f7a";
                    imgWrap.style.boxSizing = "border-box";
                    imgWrap.style.background = "#fff";
                    imgWrap.style.position = "relative";

                    const img = document.createElement("img");

                    let originalUrl = p.image || "";
                    const proxied = `${IMAGE_PROXY_BASE}/image-proxy?url=${encodeURIComponent(
                        originalUrl
                    )}`;

                    img.crossOrigin = "anonymous";
                    img.referrerPolicy = "no-referrer";

                    img.onerror = function () {
                        try {
                            const fallback = resolveImageUrl(p.image);
                            if (fallback && fallback !== proxied) {
                                img.onerror = null;
                                img.src = fallback;
                                return;
                            }
                        } catch (e) { }
                        img.src =
                            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
                    };

                    img.src = proxied;
                    img.style.width = "100%";
                    img.style.height = "100%";
                    img.style.objectFit = "cover";
                    imgWrap.appendChild(img);

                    const wm = document.createElement("img");
                    wm.crossOrigin = "anonymous";
                    wm.alt = "watermark";
                    wm.style.position = "absolute";
                    wm.style.bottom = "6px";
                    wm.style.right = "6px";
                    wm.style.opacity = "0.75";
                    wm.style.width = "28%";
                    wm.style.maxWidth = "120px";
                    wm.style.pointerEvents = "none";
                    wm.style.userSelect = "none";
                    wm.style.mixBlendMode = "normal";
                    wm.src = WATERMARK_URL;
                    imgWrap.appendChild(wm);

                    const info = document.createElement("div");
                    info.style.display = "flex";
                    info.style.flexDirection = "column";
                    info.style.alignItems = "center";
                    info.style.justifyContent = "center";
                    info.style.width = "100%";
                    info.style.marginTop = "6px";
                    info.style.fontSize = "11px";
                    info.style.color = "#0f3b6a";
                    info.style.fontWeight = "700";
                    info.style.lineHeight = "1.2";
                    info.style.textAlign = "center";

                    const line1 = document.createElement("span");
                    line1.innerHTML = `Model No. <span style="font-weight:800;">${p.model}</span>`;

                    const line2 = document.createElement("span");
                    line2.style.marginTop = "2px";
                    line2.innerHTML = `Rs.<span style="font-weight:800;">${p.price}</span>/-`;

                    info.appendChild(line1);
                    info.appendChild(line2);

                    card.appendChild(imgWrap);
                    card.appendChild(info);
                    grid.appendChild(card);
                });

                wrapper.appendChild(grid);

                const footer = document.createElement("div");
                footer.style.marginTop = "18px";
                footer.style.display = "flex";
                footer.style.justifyContent = "space-between";
                footer.style.alignItems = "center";
                footer.style.background = "#003b7a";
                footer.style.color = "white";
                footer.style.padding = "6px 12px";
                footer.style.fontSize = "12px";
                footer.innerHTML = `<span>📞 +91 9898803407</span><span>🌍 www.sarjanindustries.com</span>`;
                wrapper.appendChild(footer);

                document.body.appendChild(wrapper);

                await new Promise((r) => setTimeout(r, 150));

                const imgs = Array.from(wrapper.querySelectorAll("img"));
                await Promise.all(
                    imgs.map(
                        (image) =>
                            new Promise((resolve) => {
                                if (image.complete && image.naturalHeight !== 0) return resolve();
                                image.onload = image.onerror = () => resolve();
                                setTimeout(() => resolve(), 10000);
                            })
                    )
                );

                const canvas = await html2canvas(wrapper, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: false,
                    imageTimeout: 20000,
                });

                const imgData = canvas.toDataURL("image/png");

                const ratio = Math.min(
                    pageWidth / canvas.width,
                    pageHeight / canvas.height
                );
                const imgWidth = canvas.width * ratio;
                const imgHeight = canvas.height * ratio;

                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;

                pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

                document.body.removeChild(wrapper);
            }

            // 🔹 FILE NAME ME BHI CATEGORY ADD
            const safeCat = selectedCategory
                ? "-" + selectedCategory.replace(/[^a-z0-9]+/gi, "-").toLowerCase()
                : "";
            pdf.save(`sarjan-catalog${safeCat}.pdf`);

            showToast?.("PDF downloaded — check your Downloads folder.", "success");
        } catch (err) {
            console.error("PDF error:", err?.message || err);
            showToast?.("PDF generation failed. See console for details.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    // niche ka UI same hi rehne do (layout select + button)
    return (
        <>
            {isGenerating && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3 bg-white rounded-xl px-6 py-4 shadow-xl">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-semibold text-gray-700">Generating PDF…</p>
                    </div>
                </div>
            )}

            {/* 🔹 Top controls nice UI */}
            <div className="w-full bg-white/95 rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                {/* Left side – layout select */}
                <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700">Layout</span>
                    <select
                        value={preset}
                        onChange={(e) => {
                            setPreset(e.target.value);
                            if (e.target.value === "3x3") {
                                setRows(3); setCols(3);
                            } else if (e.target.value === "4x4") {
                                setRows(4); setCols(4);
                            }
                        }}
                        className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="3x3">3 × 3 (9 / page)</option>
                        <option value="4x4">4 × 4 (16 / page)</option>
                    </select>

                    {preset === "custom" && (
                        <>
                            <input
                                type="number"
                                min="1"
                                value={rows}
                                onChange={(e) => setRows(Number(e.target.value))}
                                className="w-16 px-2 py-1.5 border rounded-lg text-sm"
                                placeholder="rows"
                            />
                            <span className="text-sm text-gray-500">×</span>
                            <input
                                type="number"
                                min="1"
                                value={cols}
                                onChange={(e) => setCols(Number(e.target.value))}
                                className="w-16 px-2 py-1.5 border rounded-lg text-sm"
                                placeholder="cols"
                            />
                        </>
                    )}
                </div>

                {/* Right side – button */}
                <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md transition ${isGenerating
                        ? "bg-blue-400 cursor-not-allowed text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                >
                    {isGenerating
                        ? "Generating..."
                        : `Download Catalog PDF (${computeItemsPerPage()} / page)`}
                </button>
            </div>
        </>
    );

};




const ProductCard = ({ product }) => {
    return (
        <div className="w-full flex flex-col items-center">
            <div className="rounded-[22px] overflow-hidden border-[4px] border-[#1c3f7a] bg-white w-full shadow-md">
                <div className="w-full aspect-[3/4]">
                    <img
                        src={resolveImageUrl(product.image)}
                        alt={product.model}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Model */}
            <div className="w-full text-center mt-2">
                <p className="text-[12px] font-bold text-[#0f3b6a] leading-tight">
                    <span className="font-extrabold">{product.model}</span>
                </p>

                {/* Price */}
                <p className="text-[12px] font-bold text-[#0f3b6a] leading-tight mt-0.5">
                    ₹.<span className="font-extrabold">{product.price}</span>/-</p>

                {/* 🔥 Category + Subcategory (NEW) */}
                {(product.category || product.subcategory) && (
                    <p className="text-[11px] text-gray-600 mt-1 font-medium">
                        {product.category || ""}
                        {product.category && product.subcategory ? " • " : ""}
                        {product.subcategory || ""}
                    </p>
                )}
            </div>
        </div>
    );
};


const ProductGrid = () => {
    const { products } = useProducts();
    return (
        <div className="grid grid-cols-3 gap-x-2 gap-y-6 sm:gap-x-8 sm:gap-y-10 w-full">
            {products.map((p) => (
                <ProductCard key={p.id} product={p} />
            ))}
        </div>
    );
};

const Home = () => {
    // 1️⃣ context se sab le lo
    const { loading, products, categories, filters, setFilters } = useProducts();

    // 2️⃣ local state
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSub, setSelectedSub] = useState("");

    // 3️⃣ filters ko local state ke saath sync karo (lekin **kuch force** mat karo)
    useEffect(() => {
        setSelectedCategory(filters.category || "");
        setSelectedSub(filters.subcategory || "");
    }, [filters.category, filters.subcategory]);


    // 4️⃣ filtered products
    const filtered = products.filter((p) => {
        if (selectedCategory && p.category !== selectedCategory) return false;
        if (selectedSub && p.subcategory !== selectedSub) return false;
        return true;
    });

    // 5️⃣ UI
    return (
        <main className="min-h-screen bg-gray-100 flex justify-center py-5 sm:py-10 px-0 sm:px-4">
            <div className="flex flex-col items-center w-full max-w-2xl">
                <div className="mb-4 sm:mb-8 w-full max-w-[595px] px-4 sm:px-0">
                    <DownloadPdf
                        productsToExport={filtered}
                        selectedCategory={selectedCategory}
                        selectedSub={selectedSub}
                    />
                </div>


                {/* Filters + Loading */}
                <div className="w-full max-w-[595px] mb-4 px-4 sm:px-0">
                    <div className="w-full flex flex-col sm:flex-row gap-3 items-center mb-4">

                        {/* Category Dropdown */}
                        <div className="w-full sm:w-auto">
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSelectedCategory(value);
                                    setSelectedSub("");
                                    setFilters({ category: value, subcategory: "" });
                                }}
                                className="w-full min-w-[150px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option value="">All Categories</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Subcategory Dropdown */}
                        <div className="w-full sm:w-auto">
                            <select
                                value={selectedSub}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSelectedSub(value);
                                    setFilters((prev) => ({ ...prev, subcategory: value }));
                                }}
                                className={`w-full min-w-[150px] border rounded-lg px-3 py-2 text-sm shadow-sm transition
                 ${selectedCategory
                                        ? "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                                disabled={!selectedCategory}
                            >
                                <option value="">All Subcategories</option>
                                {(categories.find((c) => c.name === selectedCategory)?.sub || []).map((s) => (
                                    <option key={s.id} value={s.name}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>


                    {loading ? (
                        <div className="w-full flex items-center justify-center py-8">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-sm font-medium text-gray-700">
                                    Loading products — please wait
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div
                            id="catalog-page-main"
                            className="w-full min-h-[700px] max-w-[595px] bg-white rounded-md shadow-2xl relative px-4 sm:px-8 py-8 overflow-hidden"
                            style={{
                                backgroundImage:
                                    "repeating-linear-gradient(45deg, #ededed 0, #ededed 1px, transparent 1px, transparent 30px), repeating-linear-gradient(-45deg, #ededed 0, #ededed 1px, transparent 1px, transparent 30px)",
                                backgroundSize: "30px 30px",
                            }}
                        >
                            <div className="mb-6 pl-1 text-center">
                                <h1 className="text-[30px] sm:text-[34px] font-bold tracking-wider text-[#003b7a] leading-[1] inline-block">
                                    Sarjan<span className="text-xs sm:text-sm align-super">®</span>
                                </h1>

                                <p className="text-[10px] sm:text-[11px] tracking-[2px] text-gray-700 uppercase">
                                    The Creation Of Creativity
                                </p>

                                {/* 🔹 Current selected Category + Subcategory line */}
                                {(selectedCategory || selectedSub) && (
                                    <p className="mt-1 text-[11px] sm:text-[12px] font-semibold text-[#003b7a]">
                                        {selectedCategory || "All Categories"}
                                        {selectedSub ? ` • ${selectedSub}` : ""}
                                    </p>
                                )}
                            </div>


                            {/* product grid shows filtered */}
                            <div className="grid grid-cols-3 gap-x-2 gap-y-6 sm:gap-x-8 sm:gap-y-10 w-full">
                                {filtered.length === 0 ? (
                                    <p className="text-center text-gray-500 col-span-3">
                                        No products to show.
                                    </p>
                                ) : (
                                    filtered.map((p) => <ProductCard key={p.id} product={p} />)
                                )}
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 bg-[#003b7a] text-white flex justify-between items-center px-6 sm:px-10 py-1 text-[11px] sm:text-[13px] w-full">
                                <span>📞 +91 9898803407</span>
                                <span>🌍 www.sarjanindustries.com</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};


const Login = () => {
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
                <h4 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    Admin Login
                </h4>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter Admin email"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Admin password"
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Login
                    </button>
                </form>
            </div>
        </main>
    );
};


const Register = () => {
    const { setView } = useProducts();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (username === "admin" || username === "test") {
            setError("Username already taken.");
            return;
        }

        if (password.length < 5) {
            setError("Password must be at least 5 characters.");
            return;
        }

        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => setView("login"), 1500);
    };

    return (
        <main className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-gray-100 p-4">
            <div className="bg-white shadow-xl rounded-xl p-8 max-w-sm w-full">
                <h4 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    Register as Admin
                </h4>

                <form onSubmit={handleRegister}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                    {success && <p className="text-green-500 text-xs mb-3">{success}</p>}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        Register
                    </button>
                </form>

                <p className="text-gray-500 mt-4 text-xs text-center">
                    Already have an account?
                    <button
                        onClick={() => setView("login")}
                        className="text-blue-600 hover:text-blue-800 ml-1 font-semibold"
                    >
                        Login here
                    </button>
                </p>
            </div>
        </main>
    );
};

const NotFound = () => {
    const { setView } = useProducts();
    return (
        <main className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-gray-100 p-4">
            <div className="text-center p-10 bg-white shadow-lg rounded-xl">
                <h1 className="text-6xl font-extrabold text-gray-800">404</h1>
                <p className="text-xl text-gray-600 mt-2">Page not found.</p>
                <button
                    onClick={() => setView("home")}
                    className="inline-block mt-5 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition"
                >
                    Back to Home
                </button>
            </div>
        </main>
    );
};

// ... rest of file unchanged (ProductModal, CategoriesManager, ManageCategoriesPage, AddProduct, ProductList, AdminDashboard, AppContent, export)


const ProductModal = ({ isOpen, onClose, editingProduct }) => {
    const { addProduct, updateProduct, showToast } = useProducts();
    const [form, setForm] = useState({
        model: "",
        price: "",
        image: "",
        stock: 0,
    });

    useEffect(() => {
        if (editingProduct) {
            setForm(editingProduct);
        } else {
            setForm({ model: "", price: "", image: "", stock: 0 });
        }
    }, [editingProduct, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === "price" || name === "stock" ? Number(value) : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.model || !form.price || !form.image) {
            showToast("Please fill all required fields.", "error");
            return;
        }

        if (editingProduct) {
            updateProduct(form);
        } else {
            addProduct(form);
        }
        onClose();
    };

    const title = editingProduct ? "Edit Product" : "Add New Product";
    const submitText = editingProduct ? "Save Changes" : "Save Product";

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 sm:p-8 transform transition-all duration-300 scale-100 opacity-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
                    {title}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label htmlFor="model" className="text-sm font-medium mb-1">
                                Model No.
                            </label>
                            <input
                                type="text"
                                id="model"
                                name="model"
                                value={form.model}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="price" className="text-sm font-medium mb-1">
                                Price (Rs)
                            </label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={form.price}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                            />
                        </div>

                        <div className="flex flex-col col-span-2">
                            <label htmlFor="image" className="text-sm font-medium mb-1">
                                Image URL
                            </label>
                            <input
                                type="text"
                                id="image"
                                name="image"
                                value={form.image}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                placeholder="Paste image link here"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Accepts JPG/PNG links only.
                            </p>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="stock" className="text-sm font-medium mb-1">
                                Units in Stock
                            </label>
                            <input
                                type="number"
                                id="stock"
                                name="stock"
                                value={form.stock}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition duration-150"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150"
                        >
                            {submitText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
const CategoriesManager = () => {
    const { categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory } = useProducts();
    const [catName, setCatName] = useState("");
    const [subName, setSubName] = useState("");
    const [selectedCat, setSelectedCat] = useState("");

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-2xl font-bold mb-4">Categories Manager</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <input
                    placeholder="New category name"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="border rounded px-3 py-2"
                />
                <button onClick={() => { if (catName.trim()) { addCategory(catName.trim()); setCatName(""); } }} className="bg-indigo-600 text-white px-4 rounded">Add Category</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center mb-4">
                <select className="border rounded px-3 py-2" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input placeholder="New subcategory name" value={subName} onChange={(e) => setSubName(e.target.value)} className="border rounded px-3 py-2" />
                <button onClick={() => { if (selectedCat && subName.trim()) { addSubcategory(selectedCat, subName.trim()); setSubName(""); } }} className="bg-green-600 text-white px-4 rounded">Add Subcategory</button>
            </div>

            <div>
                {categories.length === 0 ? <p className="text-gray-500">No categories yet.</p> : (
                    <div className="space-y-3">
                        {categories.map(c => (
                            <div key={c.id} className="p-3 border rounded">
                                <div className="flex justify-between items-center">
                                    <div className="font-semibold">{c.name}</div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => deleteCategory(c.id)} className="text-red-600">Delete</button>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm">
                                    <div className="font-medium">Subcategories:</div>
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                        {c.sub.length === 0 ? <span className="text-gray-500">— none</span> : c.sub.map(s => (
                                            <span key={s.id} className="px-2 py-1 bg-gray-100 rounded flex items-center gap-2">
                                                {s.name}
                                                <button onClick={() => deleteSubcategory(c.id, s.id)} className="text-xs text-red-500 ml-2">x</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ------------------ ManageCategoriesPage ------------------
const ManageCategoriesPage = () => {
    const { categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory, products, addProduct, showToast, setFilters, setView } = useProducts();


    const [newCategory, setNewCategory] = useState("");
    const [selectedCatId, setSelectedCatId] = useState("");
    const [newSub, setNewSub] = useState("");

    // local small product form for adding product directly into selected category
    const [pForm, setPForm] = useState({
        model: "",
        price: "",
        image: "",
        stock: 0,
        category: "",
        subcategory: "",
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        // whenever selected category changes, set pForm.category to its name (or empty)
        const cat = categories.find((c) => c.id === selectedCatId);
        setPForm((prev) => ({ ...prev, category: cat ? cat.name : "", subcategory: "" }));
    }, [selectedCatId, categories]);

    const handleAddCategory = () => {
        const name = newCategory.trim();
        if (!name) return showToast("Category name required.", "error");
        addCategory(name);
        setNewCategory("");
    };

    const handleAddSub = () => {
        if (!selectedCatId) return showToast("Select a category first.", "error");
        const name = newSub.trim();
        if (!name) return showToast("Subcategory name required.", "error");
        addSubcategory(selectedCatId, name);
        setNewSub("");
    };

    const handlePChange = (e) => {
        const { name, value } = e.target;
        setPForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("image", file);

        try {
            setUploading(true);
            const res = await fetch(`${API_BASE}/upload-image`, {
                method: "POST",
                body: fd,
            });
            const data = await res.json();
            if (data.imageUrl) {
                setPForm((prev) => ({ ...prev, image: data.imageUrl }));
                showToast("Image uploaded!", "success");
            } else if (data.relative) {
                setPForm((prev) => ({ ...prev, image: data.relative }));
                showToast("Image uploaded (relative).", "success");
            } else {
                showToast("Upload failed.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Upload failed.", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleAddProductToCategory = (e) => {
        e.preventDefault();
        if (!pForm.model || !pForm.price || !pForm.image) {
            return showToast("Fill model, price and image.", "error");
        }
        // ensure category set
        const catName = pForm.category || (categories.find(c => c.id === selectedCatId)?.name) || "";
        addProduct({
            model: pForm.model,
            price: Number(pForm.price),
            image: pForm.image,
            stock: Number(pForm.stock) || 0,
            category: catName,
            subcategory: pForm.subcategory || "",
        });

        // reset form but keep category selected for convenience
        setPForm({
            model: "",
            price: "",
            image: "",
            stock: 0,
            category: catName,
            subcategory: "",
        });

        showToast("Product added to category.", "success");
    };

    // products that belong to selected category
    const productsInCat = selectedCatId
        ? products.filter((p) => p.category === (categories.find(c => c.id === selectedCatId)?.name))
        : [];

    return (
        <main className="min-h-[calc(100vh-56px)] p-6 bg-gray-50">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Manage Categories</h2>
                    <p className="text-sm text-gray-500">Create categories & add products directly into them.</p>
                </div>

                {/* Create Category */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <div className="flex gap-2">
                        <input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="New category name"
                            className="px-3 py-2 border rounded w-full"
                        />
                        <button onClick={handleAddCategory} className="px-4 bg-indigo-600 text-white rounded">Add Category</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: categories list */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold mb-3">Categories</h3>
                        {categories.length === 0 ? (
                            <p className="text-gray-500 text-sm">No categories yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {categories.map((c) => (
                                    <div key={c.id} className={`p-2 rounded flex justify-between items-center ${selectedCatId === c.id ? "bg-blue-50 border border-blue-100" : ""}`}>
                                        <div>
                                            <div className="font-medium">{c.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {c.sub.length ? c.sub.map(s => s.name).join(", ") : "— no subcategories"}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedCatId(c.id);
                                                }}
                                                className="text-sm text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                                            >
                                                Open
                                            </button>



                                            <button onClick={() => deleteCategory(c.id)} className="text-sm text-red-600 px-2 py-1 rounded hover:bg-red-50">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Middle: category details (sub add + product add form) */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold mb-3">Selected Category</h3>
                        {selectedCatId ? (
                            <>
                                <div className="mb-3">
                                    <div className="text-lg font-medium">{categories.find(c => c.id === selectedCatId)?.name}</div>
                                </div>

                                {/* Add subcategory */}
                                <div className="mb-4">
                                    <div className="flex gap-2">
                                        <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="New subcategory name" className="px-3 py-2 border rounded w-full" />
                                        <button onClick={handleAddSub} className="px-3 bg-green-600 text-white rounded">Add Sub</button>
                                    </div>
                                </div>

                                {/* Quick add product into this category */}
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
                                                    {uploading ? "Uploading..." : "Upload Image"}
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
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
                        ) : (
                            <p className="text-gray-500">Select a category from the left to manage it.</p>
                        )}
                    </div>

                    {/* Right: products in selected category */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold mb-3">Products in category</h3>
                        {selectedCatId ? (
                            productsInCat.length === 0 ? (
                                <p className="text-gray-500 text-sm">No products in this category yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {productsInCat.map((p) => (
                                        <div key={p.id} className="p-2 border rounded flex items-center gap-3">
                                            <img src={resolveImageUrl(p.image)} alt={p.model} className="w-12 h-12 object-cover rounded" />
                                            <div className="flex-1">
                                                <div className="font-medium">{p.model}</div>
                                                <div className="text-xs text-gray-500">₹{p.price} • Stock: {p.stock}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <p className="text-gray-500">Select a category to view its products.</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};
// ------------------ end ManageCategoriesPage ------------------


const AddProduct = () => {
    const { addProduct, showToast, categories } = useProducts();
    const [form, setForm] = useState({
        model: "",
        price: "",
        image: "",
        stock: 0,
        category: "",
        subcategory: "",
    });

    const [uploading, setUploading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // when category changes, reset subcategory
        if (name === "category") {
            setForm((prev) => ({ ...prev, category: value, subcategory: "" }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fd = new FormData();
        fd.append("image", file);

        try {
            setUploading(true);
            const res = await fetch(`${API_BASE}/upload-image`, {
                method: "POST",
                body: fd,
            });

            const data = await res.json();
            console.log("upload response:", data);

            // prefer absolute imageUrl if provided by server
            if (data.imageUrl) {
                setForm((prev) => ({
                    ...prev,
                    image: data.imageUrl, // <-- save absolute URL
                }));
                showToast("Image uploaded successfully!", "success");
            } else if (data.relative) {
                // fallback to relative (will be proxied or resolved by resolveImageUrl)
                setForm((prev) => ({ ...prev, image: data.relative }));
                showToast("Image uploaded (relative).", "success");
            } else {
                showToast("Image upload failed.", "error");
            }
        } catch (err) {
            console.error("Upload error:", err?.message || err);
            showToast("Image upload failed.", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.model || !form.price || !form.image) {
            showToast("Please fill all required fields.", "error");
            return;
        }

        addProduct({
            model: form.model,
            price: Number(form.price),
            image: form.image,
            stock: Number(form.stock) || 0,
            category: form.category || "",
            subcategory: form.subcategory || "",
        });

        setForm({
            model: "",
            price: "",
            image: "",
            stock: 0,
            category: "",
            subcategory: "",
        });
    };

    // helper to get subcategories for selected category name
    const availableSubcats =
        (categories.find((c) => c.name === form.category)?.sub || []).map(
            (s) => s.name
        ) || [];

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
                Add New Product (UPLOAD VERSION)
            </h2>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
                {/* Name / Model */}
                <div className="flex flex-col">
                    <label htmlFor="model" className="text-sm font-medium mb-1">
                        Name
                    </label>
                    <input
                        type="text"
                        name="model"
                        id="model"
                        value={form.model}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="e.g. Fancy Lizard"
                        required
                    />
                </div>

                {/* Price */}
                <div className="flex flex-col">
                    <label htmlFor="price" className="text-sm font-medium mb-1">
                        Price (Rs)
                    </label>
                    <input
                        type="number"
                        name="price"
                        id="price"
                        value={form.price}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="120"
                        required
                    />
                </div>

                {/* Stock */}
                <div className="flex flex-col">
                    <label htmlFor="stock" className="text-sm font-medium mb-1">
                        Units in Stock
                    </label>
                    <input
                        type="number"
                        name="stock"
                        id="stock"
                        value={form.stock}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="0"
                        required
                    />
                </div>

                {/* Category */}
                <div className="flex flex-col">
                    <label htmlFor="category" className="text-sm font-medium mb-1">
                        Category
                    </label>
                    <select
                        id="category"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
                    >
                        <option value="">Select category (optional)</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mt-3">
                    <label htmlFor="subcategory" className="text-sm font-medium mb-1 block">
                        Subcategory
                    </label>
                    <select
                        id="subcategory"
                        name="subcategory"
                        value={form.subcategory}
                        onChange={handleChange}
                        disabled={!form.category || availableSubcats.length === 0}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition w-full"
                    >
                        <option value="">
                            {form.category ? "Select subcategory (optional)" : "Select category first"}
                        </option>
                        {availableSubcats.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Choose subcategory if available (optional).
                    </p>
                </div>

                {/* Image URL + Upload (span 3 cols) */}
                <div className="flex flex-col md:col-span-3">
                    <label htmlFor="image" className="text-sm font-medium mb-1">
                        Image URL
                    </label>
                    <input
                        type="text"
                        name="image"
                        id="image"
                        value={form.image}
                        onChange={handleChange}
                        placeholder="Auto-filled after upload or paste manual URL"
                        className="border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Paste direct link OR upload from device.
                    </p>

                    {/* Upload Button + Preview */}
                    <div className="mt-2 flex items-center gap-4">
                        <label className="cursor-pointer text-sm font-medium text-indigo-600 border border-dashed border-indigo-400 px-3 py-1 rounded-lg hover:bg-indigo-50">
                            {uploading ? "Uploading..." : "Upload Image"}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </label>

                        {form.image && (
                            <img
                                src={resolveImageUrl(form.image)}
                                alt="preview"
                                style={{ width: "100px", height: "auto", marginTop: "10px" }}
                            />
                        )}
                    </div>

                    {/* Subcategory select (shows when category selected) */}

                </div>

                <div className="md:col-span-1 flex items-end justify-start md:justify-end">
                    <button
                        type="submit"
                        className="w-full md:w-auto px-6 py-2 text-base font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition transform hover:scale-[1.02]"
                    >
                        + Save New Product
                    </button>
                </div>
            </form>
        </div>
    );
};

const ProductList = () => {
    const { products, deleteProduct } = useProducts();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8 border border-gray-200 overflow-x-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
                All Products
            </h2>

            {products.length === 0 ? (
                <p className="text-gray-500 py-4">No products yet. Add some above.</p>
            ) : (
                <div className="min-w-full inline-block align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    #
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Preview
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Model No.
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                    Stock
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                    Image URL
                                </th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {products.map((p, index) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <img
                                            src={resolveImageUrl(p.image)}
                                            alt={p.model}
                                            className="w-16 h-16 object-cover rounded-md shadow-sm border border-gray-200"
                                        />
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                                        {p.model}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                        Rs. {p.price}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                        {p.stock}
                                    </td>
                                    <td className="px-4 py-4 text-xs text-gray-500 truncate max-w-xs hidden lg:table-cell">
                                        {p.image}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex space-x-2 justify-end">
                                            <button
                                                onClick={() => handleOpenEditModal(p)}
                                                className="text-indigo-600 hover:text-indigo-900 px-3 py-1 rounded-md hover:bg-indigo-50 transition font-medium"
                                                title="Edit Product"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(p.id)}
                                                className="text-red-600 hover:text-red-900 px-3 py-1 rounded-md hover:bg-red-50 transition font-medium"
                                                title="Delete Product"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ProductModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                editingProduct={editingProduct}
            />
        </div>
    );
};

const AdminDashboard = () => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const { setView } = useProducts();

    useEffect(() => {
        if (!isAdmin) {
            setView("login");
        }
    }, [isAdmin, setView]);

    if (!isAdmin) {
        return <Login />;
    }

    return (
        <main className="py-4 bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
                            Admin Panel ⚙️
                        </h1>
                        <p className="text-lg text-gray-500 mt-2">
                            Manage all products in your catalog.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* <button
                            onClick={() => setView("manage-categories")}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold shadow hover:bg-yellow-600 transition"
                        >
                            Manage Categories
                        </button> */}

                        {/* <DownloadPdf /> */}
                    </div>
                </header>

                <AddProduct />
                <ProductList />
            </div>
            <CatalogView />
        </main>
    );
};

function AppContent() {
    const { view } = useProducts();

    const renderView = () => {
        switch (view) {
            case "admin":
                return <AdminDashboard />;
            case "login":
                return <Login />;
            case "register":
                return <Register />;
            case "home":
                return <Home />;
            case "manage-categories":
                return <ManageCategoriesPage />;
            default:
                return <NotFound />;
        }
    };


    return (
        <>
            <Navbar />
            {renderView()}
            <Toast />
        </>
    );
}

export default function ProductCatalogApp() {
    return (
        <ProductProvider>
            <AppContent />
        </ProductProvider>
    );
}
