import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { Plus, Edit, Trash2, FolderTree, Loader2, Search, X, ArrowRight } from "lucide-react";

export default function CategoryList() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ១. Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get("/categories");
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      if (err.response?.status !== 401) {
        alert("Failed to load categories.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axiosClient
      .get("/categories")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setCategories(data);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        if (err.response?.status !== 401) {
          alert("Failed to load categories.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ២. Open Modal for Create or Edit
  const handleOpenModal = (category = null) => {
    if (category) {
      const id = category.category_id || category.id;
      setEditId(id);
      setCategoryName(category.category_name || category.name || "");

      // កំណត់ Preview Image URL
      if (category.image_url) {
        setPreviewUrl(category.image_url);
      } else if (category.image) {
        const imagePath = category.image.startsWith("http")
          ? category.image
          : `http://127.0.0.1:8000/storage/${category.image}`;
        setPreviewUrl(imagePath);
      } else {
        setPreviewUrl("");
      }
      setImageFile(null);
    } else {
      // ករណីចុចប៊ូតុង "Add Category" ថ្មី
      setEditId(null);
      setCategoryName("");
      setPreviewUrl("");
      setImageFile(null);
    }
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setEditId(null);
    setCategoryName("");
    setPreviewUrl("");
    setImageFile(null);
  };

  // ៣. Handle Image File Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // ៤. Submit Form (Create / Update with Multipart Payload)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setSubmitting(true);

    const formData = new FormData();
    formData.append("category_name", categoryName);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      if (editId) {
        formData.append("_method", "PUT");
        await axiosClient.post(`/categories/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axiosClient.post("/categories", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      handleCloseModal();
      await fetchCategories();
    } catch (err) {
      console.error("Error saving category:", err);
      alert(err.response?.data?.message || "Failed to save category.");
    } finally {
      setSubmitting(false);
    }
  };

  // ៥. Delete Category
  const handleDelete = async (cat) => {
    const id = cat.category_id || cat.id;
    if (!id) return;

    if (
      window.confirm(
        `Are you sure you want to delete "${cat.category_name || cat.name}"?`,
      )
    ) {
      try {
        await axiosClient.delete(`/categories/${id}`);
        await fetchCategories();
      } catch (err) {
        console.error("Error deleting category:", err);
        alert(err.response?.data?.message || "Failed to delete category.");
      }
    }
  };

  // ៦. Live Search Filtering
  const filteredCategories = categories.filter((cat) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (cat.category_name || cat.name || "").toLowerCase().includes(query);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderTree className="text-amber-600" /> Category Management
          </h1>
          <p className="text-slate-500 text-sm">
            Manage coffee & beverage categories
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Live search categories..."
          className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
              <th className="p-4">ID</th>
              <th className="p-4">Image</th>
              <th className="p-4">Category Name</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-6 text-center text-slate-400">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2
                      className="animate-spin text-amber-600"
                      size={20}
                    />{" "}
                    Loading categories...
                  </div>
                </td>
              </tr>
            ) : filteredCategories.length > 0 ? (
              filteredCategories.map((cat, index) => {
                const catId = cat.category_id || cat.id || index + 1;
                return (
                  <tr key={catId} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-medium">#{catId}</td>
                    <td className="p-4">
                      <button
                        onClick={() => navigate(`/products?category=${catId}`)}
                        title="View products in this category"
                        className="block"
                      >
                        <img
                          src={
                            cat.image_url
                              ? cat.image_url
                              : cat.image
                                ? cat.image.startsWith("http")
                                  ? cat.image
                                  : `http://127.0.0.1:8000/storage/${cat.image}`
                                : "https://placehold.co/150?text=No+Image"
                          }
                          alt={cat.category_name || "Category"}
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://placehold.co/150?text=No+Image";
                          }}
                        />
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => navigate(`/products?category=${catId}`)}
                        className="flex items-center gap-1.5 font-semibold text-slate-800 group hover:text-amber-600 transition"
                        title={`View products in ${cat.category_name || cat.name}`}
                      >
                        {cat.category_name || cat.name}
                        <ArrowRight
                          size={15}
                          className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition"
                        />
                      </button>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(cat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="p-6 text-center text-slate-400">
                  {searchTerm
                    ? `No categories found matching "${searchTerm}".`
                    : "No categories found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal dialog for Create / Update */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-slate-800">
              {editId ? "Edit Category" : "Add New Category"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Espresso, Cold Brew, Bakery"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="mt-2 w-20 h-20 object-cover rounded-xl border border-slate-200"
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition font-medium flex items-center gap-2"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  {editId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
