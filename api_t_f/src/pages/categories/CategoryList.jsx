import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Plus, Edit, Trash2, FolderTree, Loader2 } from 'lucide-react';

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ១. Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/categories');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      if (err.response?.status !== 401) {
        alert('Failed to load categories.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axiosClient
      .get('/categories')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setCategories(data);
      })
      .catch((err) => {
        console.error('Error fetching categories:', err);
        if (err.response?.status !== 401) {
          alert('Failed to load categories.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ២. Open Modal for Create or Edit
  const handleOpenModal = (category = null) => {
    if (category) {
      const id = category.category_id || category.id;
      setEditId(id);
      setCategoryName(category.category_name || category.name || '');
    } else {
      setEditId(null);
      setCategoryName('');
    }
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setEditId(null);
    setCategoryName('');
  };

  // ៣. Submit Form (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setSubmitting(true);
    const payload = {
      category_name: categoryName
    };

    try {
      if (editId) {
        await axiosClient.put(`/categories/${editId}`, payload);
      } else {
        await axiosClient.post('/categories', payload);
      }
      handleCloseModal();
      await fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      alert(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  // ៤. Delete Category
  const handleDelete = async (cat) => {
    const id = cat.category_id || cat.id;
    if (!id) return;

    if (window.confirm(`Are you sure you want to delete "${cat.category_name || cat.name}"?`)) {
      try {
        await axiosClient.delete(`/categories/${id}`);
        await fetchCategories();
      } catch (err) {
        console.error('Error deleting category:', err);
        alert(err.response?.data?.message || 'Failed to delete category.');
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderTree className="text-amber-600" /> Category Management
          </h1>
          <p className="text-slate-500 text-sm">Manage coffee & beverage categories</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
              <th className="p-4">ID</th>
              <th className="p-4">Category Name</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
            {loading ? (
              <tr>
                <td colSpan="3" className="p-6 text-center text-slate-400">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="animate-spin text-amber-600" size={20} /> Loading categories...
                  </div>
                </td>
              </tr>
            ) : categories.length > 0 ? (
              categories.map((cat, index) => {
                const catId = cat.category_id || cat.id || index + 1;
                return (
                  <tr key={catId} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-medium">#{catId}</td>
                    <td className="p-4 font-semibold text-slate-800">
                      {cat.category_name || cat.name}
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
                <td colSpan="3" className="p-6 text-center text-slate-400">
                  No categories found.
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
              {editId ? 'Edit Category' : 'Add New Category'}
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
                  {editId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}