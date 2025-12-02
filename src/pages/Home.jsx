import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import React, {
    useState,
    useContext,
    createContext,
    useMemo,
    useEffect,
} from "react";
import axios from "axios";


const API_BASE = "https://sarjan-catalog.onrender.com/api";
const ADMIN_PASSWORD = "12345";


const IMAGE_PROXY_BASE =
    typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1")
        ? "http://localhost:5000/api"
        : "https://sarjan-catalog.onrender.com/api";


const ProductContext = createContext();

const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [toast, setToast] = useState({ message: "", type: "", id: null });
    const [view, setView] = useState("home");
    const [loading, setLoading] = useState(false);

    const showToast = (message, type = "success") => {
        setToast({ message, type, id: Date.now() });
        setTimeout(() => setToast({ message: "", type: "", id: null }), 3000);
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE}/products`);
                const mapped = res.data.map((p) => ({ ...p, id: p._id }));
                setProducts(mapped);
            } catch (err) {
                console.error("Fetch products error:", err.message);
                showToast("Failed to load products.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const addProduct = async (product) => {
        try {
            const res = await axios.post(`${API_BASE}/products`, product);
            const saved = res.data;
            setProducts((prev) => [...prev, { ...saved, id: saved._id }]);
            showToast(`Product ${product.model} added successfully.`);
        } catch (err) {
            console.error("Add product error:", err.message);
            showToast("Failed to add product.", "error");
        }
    };

    const updateProduct = async (updatedProduct) => {
        try {
            const id = updatedProduct.id;

            const payload = {
                model: updatedProduct.model,
                price: updatedProduct.price,
                image: updatedProduct.image,
                stock: updatedProduct.stock,
            };

            const res = await axios.put(`${API_BASE}/products/${id}`, payload);
            const saved = res.data;

            setProducts((prev) =>
                prev.map((p) => (p.id === id ? { ...saved, id: saved._id } : p))
            );

            showToast(`Product ${updatedProduct.model} updated.`);
        } catch (err) {
            console.error("Update product error:", err.message);
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
            console.error("Delete product error:", err.message);
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
        }),
        [products, toast, view, loading]
    );

    return (
        <ProductContext.Provider value={contextValue}>
            {children}
        </ProductContext.Provider>
    );
};

const useProducts = () => useContext(ProductContext);


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
                            <div
                                onClick={() => handleNavClick("home")}
                                className={`text-sm px-2 cursor-pointer ${isActive("home")}`}
                            >
                                Front Page
                            </div>

                            <div
                                onClick={() => handleNavClick("admin")}
                                className={`text-sm px-2 cursor-pointer ${isActive("admin")}`}
                            >
                                Admin
                            </div>

                            <div
                                onClick={() => handleNavClick("register")}
                                className={`text-sm px-2 cursor-pointer ${isActive("register")}`}
                            >
                                Register
                            </div>

                            {!isAdmin ? (
                                <div
                                    onClick={() => handleNavClick("login")}
                                    className="text-sm px-2 text-blue-600 cursor-pointer"
                                >
                                    Admin Login
                                </div>
                            ) : (
                                <button
                                    onClick={handleLogout}
                                    className="text-sm px-2 text-red-600 text-left"
                                >
                                    Logout
                                </button>
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
                                    src={p.image}
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


const DownloadPdf = () => {
    const { products, showToast } = useProducts();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        try {
            if (!products || products.length === 0) {
                showToast?.("No products to export.", "error");
                return;
            }

            setIsGenerating(true);

            const itemsPerPage = 9;
            const chunks = [];
            for (let i = 0; i < products.length; i += itemsPerPage) {
                chunks.push(products.slice(i, i + itemsPerPage));
            }

            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            for (let pageIndex = 0; pageIndex < chunks.length; pageIndex++) {
                const pageItems = chunks[pageIndex];

                if (pageIndex > 0) {
                    pdf.addPage();
                }

                const wrapper = document.createElement("div");
                wrapper.style.width = "595px";
                wrapper.style.padding = "32px";
                wrapper.style.background = "#fff";
                wrapper.style.boxSizing = "border-box";
                wrapper.style.position = "fixed";
                wrapper.style.left = "-9999px";
                wrapper.style.top = "0";
                wrapper.style.zIndex = "99999";
                wrapper.style.fontFamily = "Arial, Helvetica, sans-serif";

                const header = document.createElement("div");
                header.innerHTML = `
          <h1 style="margin:0;font-size:34px;color:#003b7a;text-align:center;font-weight:700;">
            Sarjan<span style="font-size:12px;vertical-align:super">®</span>
          </h1>
          <p style="margin:6px 0 18px;text-align:center;font-size:11px;color:#666;letter-spacing:2px">
            The Creation Of Creativity
          </p>
        `;
                wrapper.appendChild(header);

                const grid = document.createElement("div");
                grid.style.display = "grid";
                grid.style.gridTemplateColumns = "repeat(3, 1fr)";
                grid.style.gap = "12px";

                pageItems.forEach((p) => {
                    const card = document.createElement("div");
                    card.style.display = "flex";
                    card.style.flexDirection = "column";
                    card.style.alignItems = "center";

                    const imgWrap = document.createElement("div");
                    imgWrap.style.width = "100%";
                    imgWrap.style.aspectRatio = "3/4";
                    imgWrap.style.overflow = "hidden";
                    imgWrap.style.borderRadius = "18px";
                    imgWrap.style.border = "4px solid #1c3f7a";
                    imgWrap.style.boxSizing = "border-box";
                    imgWrap.style.background = "#fff";

                    const img = document.createElement("img");
                    const proxied = `${IMAGE_PROXY_BASE}/image-proxy?url=${encodeURIComponent(
                        p.image
                    )}`;
                    img.crossOrigin = "anonymous";
                    img.src = proxied;
                    img.style.width = "100%";
                    img.style.height = "100%";
                    img.style.objectFit = "cover";
                    imgWrap.appendChild(img);

                    const info = document.createElement("div");
                    info.style.display = "flex";
                    info.style.justifyContent = "space-between";
                    info.style.width = "100%";
                    info.style.marginTop = "6px";
                    info.style.fontSize = "11px";
                    info.innerHTML = `<span>Model No. <strong>${p.model}</strong></span><span>Rs.<strong>${p.price}</strong>/-</span>`;

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

                await new Promise((r) => setTimeout(r, 120));
                const imgs = Array.from(wrapper.querySelectorAll("img"));
                await Promise.all(
                    imgs.map(
                        (image) =>
                            new Promise((resolve) => {
                                if (image.complete && image.naturalHeight !== 0) return resolve();
                                image.onload = image.onerror = () => resolve();
                            })
                    )
                );

                const canvas = await html2canvas(wrapper, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
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

            pdf.save("sarjan-catalog.pdf");
            showToast?.("PDF downloaded — check your Downloads folder.", "success");
        } catch (err) {
            console.error("PDF error:", err);
            showToast?.("PDF generation failed. See console for details.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            {isGenerating && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3 bg-white rounded-xl px-6 py-4 shadow-xl">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-semibold text-gray-700">
                            Generating PDF… Please wait
                        </p>
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className={`px-5 py-2 rounded-lg text-white text-sm font-semibold shadow-md transition duration-200 ${isGenerating
                            ? "bg-blue-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    {isGenerating ? "Generating..." : "Download Catalog PDF"}
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
                        src={product.image}
                        alt={product.model}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            <div className="flex justify-between mt-1 text-[10px] sm:text-[12px] text-black w-full px-0.5">
                <span className="text-left leading-tight">
                    Model No. <span className="font-semibold">{product.model}</span>
                </span>
                <span className="text-right leading-tight">
                    Rs.<span className="font-semibold">{product.price}/-</span>
                </span>
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
    return (
        <main className="min-h-screen bg-gray-100 flex justify-center py-5 sm:py-10 px-0 sm:px-4">
            <div className="flex flex-col items-center w-full max-w-2xl">
                <div className="mb-4 sm:mb-8 w-full max-w-[595px] px-4 sm:px-0">
                    <DownloadPdf />
                </div>

                <div
                    id="catalog-page-main"
                    className="
            w-full 
            min-h-[700px]
            max-w-[595px] 
            bg-white 
            rounded-md 
            shadow-2xl
            relative
            px-4
            sm:px-8
            py-8
            overflow-hidden
          "
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
                    </div>

                    <ProductGrid />

                    <div className="absolute bottom-0 left-0 right-0 bg-[#003b7a] text-white flex justify-between items-center px-6 sm:px-10 py-1 text-[11px] sm:text-[13px] w-full">
                        <span>📞 +91 9898803407</span>
                        <span>🌍 www.sarjanindustries.com</span>
                    </div>
                </div>
            </div>
        </main>
    );
};


const Login = () => {
    const [password, setPassword] = useState("");
    const { setView } = useProducts();
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (password === ADMIN_PASSWORD) {
            localStorage.setItem("isAdmin", "true");
            setView("admin");
        } else {
            setError("Wrong password");
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
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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

                <p className="text-gray-500 mt-4 text-xs text-center">
                    Demo Password:{" "}
                    <code className="font-semibold text-blue-600">
                        {ADMIN_PASSWORD}
                    </code>
                </p>
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

const AddProduct = () => {
  const { addProduct, showToast } = useProducts();
  const [form, setForm] = useState({
    model: "",
    price: "",
    image: "",
    stock: 0,
  });

  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // 🔵 Image Upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", file);

      const res = await axios.post(`${API_BASE}/upload-image`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { imageUrl } = res.data;

      setForm((prev) => ({ ...prev, image: imageUrl }));
      showToast("Image uploaded successfully!", "success");
    } catch (err) {
      console.error("Image upload error:", err);
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
      model: form.model,               // yahi name/model save hoga
      price: Number(form.price),
      image: form.image,               // uploaded image url
      stock: Number(form.stock) || 0,
    });

    setForm({
      model: "",
      price: "",
      image: "",
      stock: 0,
    });
  };

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

        {/* Image URL + Upload */}
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
                src={form.image}
                alt="Preview"
                className="w-16 h-16 object-cover rounded border"
              />
            )}
          </div>
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
                                            src={p.image}
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
                    <DownloadPdf />
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
