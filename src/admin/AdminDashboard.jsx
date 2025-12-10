import React, {
  useState,
  useContext,
  createContext,
  useMemo,
  useEffect,
} from "react";
import axios from "axios";

const ProductContext = createContext();
const API_BASE = "http://localhost:5000/api"; // 👉 yaha base URL

const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [toast, setToast] = useState({ message: "", type: "", id: null });
  const [loading, setLoading] = useState(false);

  // 🟢 Toast helper
  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast({ message: "", type: "", id: null }), 3000);
  };

  // 🟢 Initial load: DB se products fetch
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/products`);
        // _id ko id me map kar diya, taki niche ka UI same chale
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

  // 🟢 Add product (DB + state)
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

  // 🟢 Update product (DB + state)
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

  // 🟢 Delete product (DB + state)
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
      loading,
    }),
    [products, toast, loading]
  );

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};

const useProducts = () => useContext(ProductContext);

// 🟢 Toast component
const Toast = () => {
  const { toast } = useProducts();
  if (!toast.message) return null;

  const baseStyle =
    "fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white transition-opacity duration-300 z-[100]";
  const style = toast.type === "error" ? "bg-red-600" : "bg-green-500";

  return <div className={`${baseStyle} ${style}`}>{toast.message}</div>;
};

// 🟢 Modal for Add/Edit
const ProductModal = ({ isOpen, onClose, editingProduct }) => {
  const { addProduct, updateProduct, showToast } = useProducts();
  const [form, setForm] = useState({
    id: null,
    model: "",
    price: "",
    image: "",
    stock: 0,
  });

  useEffect(() => {
    if (editingProduct) {
      setForm(editingProduct);
    } else {
      setForm({ id: null, model: "", price: "", image: "", stock: 0 });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.model || !form.price || !form.image) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    if (editingProduct) {
      await updateProduct(form);
    } else {
      await addProduct(form);
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

// 🟢 Simple AddProduct form (top section)
const AddProduct = () => {
  const { addProduct, showToast } = useProducts();
  const [form, setForm] = useState({
    model: "",
    price: "",
    image: "",
    stock: 0,
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.model || !form.price || !form.image) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    await addProduct({
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
        Add New Product
      </h2>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
        <div className="flex flex-col">
          <label htmlFor="model" className="text-sm font-medium mb-1">
            Model No.
          </label>
          <input
            type="text"
            name="model"
            id="model"
            value={form.model}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="e.g. S-150"
            required
          />
        </div>

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
            placeholder="https://..."
            className="border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste a direct link to the image (jpg/png).
          </p>
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

// 🟢 List + Edit/Delete table
const ProductList = () => {
  const { products, deleteProduct, loading } = useProducts();
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

      {loading ? (
        <p className="text-gray-500 py-4">Loading products...</p>
      ) : products.length === 0 ? (
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
  return (
    <main className="py-4 bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
            Admin Panel ⚙️
          </h1>
          <p className="text-lg text-gray-500 mt-2">
            Manage all products in your catalog.
          </p>
        </header>
        <CategoriesManager />
        <AddProduct />
        <ProductList />
      </div>
    </main>
  );
};

export default function ProductAdminApp() {
  return (
    <ProductProvider>
      <AdminDashboard />
      <Toast />
    </ProductProvider>
  );
}
