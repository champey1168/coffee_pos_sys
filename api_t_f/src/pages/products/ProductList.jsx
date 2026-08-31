import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Plus, Edit, Trash2, Coffee, Search, X } from 'lucide-react';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategoryId = searchParams.get('category') || '';

  // Form States
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // ១. Fetch Products & Categories
  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axiosClient.get('/products'),
        axiosClient.get('/categories')
      ]);
      const fetchedCategories = catRes.data.data || catRes.data;
      setProducts(prodRes.data.data || prodRes.data);
      setCategories(fetchedCategories);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ២. Open Modal (Create / Edit)
  const handleOpenModal = (product = null) => {
    if (product) {
      // ប្រើ product_id តាម Database Structure ថ្មី
      setEditId(product.product_id || product.id);
      setProductName(product.product_name || product.name || '');
      setCategoryId(product.category_id || '');
      setPrice(product.price || '');
      setPreviewUrl(
        product.image 
          ? `http://localhost:8000/storage/${product.image}` 
          : (product.image_url || '')
      );
      setImageFile(null);
    } else {
      setEditId(null);
      setProductName('');
      // កំណត់ Category ទី១ ជា default value ពេលបង្កើតថ្មី
      const firstCatId = categories[0]?.category_id || categories[0]?.id || '';
      setCategoryId(firstCatId);
      setPrice('');
      setPreviewUrl('');
      setImageFile(null);
    }
    setIsOpen(true);
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

    const formData = new FormData();
    formData.append('product_name', productName);
    formData.append('category_id', categoryId);
    formData.append('price', price);

    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editId) {
        // Method Spoofing សម្រាប់ Laravel File Upload លើ Update Route
        formData.append('_method', 'PUT');
        await axiosClient.post(`/products/${editId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axiosClient.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setIsOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving product:', err.response?.data || err);
      alert('Error: ' + (err.response?.data?.message || 'Could not save product'));
    }
  };

  // ៥. Delete Product
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axiosClient.delete(`/products/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting product:', err);
      }
    }
  };

  // ៦. Live Search Filtering
  const filteredProducts = products.filter((prod) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesCategory = activeCategoryId
      ? String(prod.category_id || prod.category?.category_id || '') === String(activeCategoryId)
      : true;
    const matchesSearch = !query ||
      (prod.product_name || prod.name || '').toLowerCase().includes(query) ||
      (prod.category?.category_name || prod.category?.name || '').toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const activeCategory = categories.find(
    (cat) => String(cat.category_id || cat.id) === String(activeCategoryId)
  );

  const clearCategoryFilter = () => {
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Coffee className="text-amber-600" /> Product Management
          </h1>
          <p className="text-slate-500 text-sm">Manage drinks, prices, and menu items</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Search Bar + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Live search products or categories..."
            className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <select
          value={activeCategoryId}
          onChange={(e) => {
            if (e.target.value) {
              setSearchParams({ category: e.target.value });
            } else {
              clearCategoryFilter();
            }
          }}
          className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => {
            const catId = cat.category_id || cat.id;
            return (
              <option key={catId} value={catId}>
                {cat.category_name || cat.name}
              </option>
            );
          })}
        </select>
      </div>

      {/* Active Category Indicator */}
      {activeCategory && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <span className="font-medium text-amber-700">
            Showing products in: {activeCategory.category_name || activeCategory.name}
          </span>
          <button
            onClick={clearCategoryFilter}
            className="flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold"
          >
            <X size={14} /> Clear
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
              <th className="p-4">Image</th>
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((prod) => {
                const prodId = prod.product_id || prod.id;
                return (
                  <tr key={prodId} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <img
                        src={
                          prod.image 
                            ? `http://localhost:8000/storage/${prod.image}` 
                            : (prod.image_url || 'https://placehold.co/150?text=No+Image')
                        }
                        alt={prod.product_name || 'Product'}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/150?text=No+Image';
                        }}
                      />
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {prod.product_name || prod.name}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold">
                        {prod.category?.category_name || prod.category?.name || 'Beverage'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-amber-600">
                      ${parseFloat(prod.price || 0).toFixed(2)}
                    </td>
                    <td className="p-4 flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => handleOpenModal(prod)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(prodId)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="p-6 text-center text-slate-400">
                  {activeCategory
                    ? `No products found in "${activeCategory.category_name || activeCategory.name}".`
                    : searchTerm
                      ? `No products found matching "${searchTerm}".`
                      : 'No products found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-slate-800">
              {editId ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Iced Latte"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => {
                    const catId = cat.category_id || cat.id;
                    return (
                      <option key={catId} value={catId}>
                        {cat.category_name || cat.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="2.50"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Product Image
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
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition font-medium"
                >
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