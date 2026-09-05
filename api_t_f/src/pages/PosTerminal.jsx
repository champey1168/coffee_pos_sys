import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { ShoppingBag, Plus, Minus, Trash2, CreditCard, Search, X, Printer, LayoutGrid, Coffee, CupSoda, Soup, Sandwich, Bean, IceCreamCone, CakeSlice, Tag } from 'lucide-react';

const CATEGORY_ICONS = {
  Coffee: Coffee,
  Espresso: Coffee,
  Latte: Coffee,
  Tea: CupSoda,
  'Cold Brew': CupSoda,
  Smoothie: CupSoda,
  Juice: CupSoda,
  Bakery: CakeSlice,
  Cake: CakeSlice,
  Dessert: IceCreamCone,
  Snack: Sandwich,
  Sandwich: Sandwich,
  Bean: Bean,
  Soup: Soup,
};

const NO_SUGAR_CATEGORIES = new Set([
  'pastries',
  'sandwiches',
  'breakfast',
  'snacks',
  'desserts',
  'specials',
  'water',
]);

const getProductCategoryName = (product) => {
  return (
    product?.category?.category_name ||
    product?.category?.name ||
    product?.category_name ||
    ''
  );
};

const isNoSugarProduct = (product) => {
  const categoryName = getProductCategoryName(product).toLowerCase();
  const productName = (product?.product_name || product?.name || '').toLowerCase();
  return NO_SUGAR_CATEGORIES.has(categoryName) || productName.includes('water');
};

export default function PosTerminal() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Selection & Cart States
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Product Selection Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sugarLevel, setSugarLevel] = useState('50%');
  const [size, setSize] = useState('Medium');
  const [itemQty, setItemQty] = useState(1);
  const [remarks, setRemarks] = useState('');

  // Receipt Modal State
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const EXCHANGE_RATE = 4000;

  // គណនាតម្លៃផ្អែកលើ Size
  const calculateUnitPrice = (basePrice, selectedSize) => {
    const price = parseFloat(basePrice || 0);
    if (selectedSize === 'Small') return Math.max(0, price - 0.20);
    if (selectedSize === 'Large') return price + 0.50;
    return price;
  };

  // ១. Fetch Products & Categories
  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        axiosClient.get('/products'),
        axiosClient.get('/categories')
      ]);

      const loadedProducts =
        prodRes.status === 'fulfilled'
          ? Array.isArray(prodRes.value.data)
            ? prodRes.value.data
            : (prodRes.value.data.data || [])
          : [];
      const loadedCategories =
        catRes.status === 'fulfilled'
          ? Array.isArray(catRes.value.data)
            ? catRes.value.data
            : (catRes.value.data.data || [])
          : [];

      setProducts(loadedProducts);
      setCategories(loadedCategories);
    } catch (err) {
      console.error('Error loading POS data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ២. Open Product Modal
  const openProductModal = (product) => {
    setSelectedProduct(product);
    setSugarLevel('50%');
    setSize('Medium');
    setItemQty(1);
    setRemarks('');
  };

  // ៣. Add Item to Cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const prodId = selectedProduct.product_id || selectedProduct.id;
    const finalUnitPrice = calculateUnitPrice(selectedProduct.price, size);
    const noSugar = isNoSugarProduct(selectedProduct);

    const cartItem = {
      ...selectedProduct,
      cartItemId: `${prodId}-${sugarLevel}-${size}-${Date.now()}`,
      product_id: prodId,
      sugar_level: noSugar ? null : sugarLevel,
      size: size,
      quantity: itemQty,
      remarks: remarks,
      price: finalUnitPrice,
    };

    setCart((prevCart) => [...prevCart, cartItem]);
    setSelectedProduct(null);
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (cartItemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartItemId !== cartItemId));
  };

  // ៤. Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = subtotal;

  // ៥. Submit Order
  const handleCheckout = async () => {
    if (cart.length === 0 || loading) return;

    const payload = {
      order_type: 'TAKEAWAY',
      items: cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        sugar_level: item.sugar_level,
        size: item.size,
        price: item.price,
        remarks: item.remarks,
      })),
    };

    setLoading(true);

    try {
      const res = await axiosClient.post('/orders', payload);
      const newOrder = res.data?.data || res.data;

      setCompletedOrder({
        queueNumber: newOrder?.queue_number || `#${String(newOrder?.order_id || newOrder?.id || 8).padStart(2, '0')}`,
        items: cart.map((item) => ({
          name: item.product_name || item.name,
          categoryName: item.category?.category_name || item.category?.name || 'Coffee',
          qty: item.quantity,
          price: item.price,
          sugar: item.sugar_level,
          size: item.size,
          remarks: item.remarks,
        })),
        subtotal: grandTotal,
        date: new Date().toLocaleString(),
      });

      setShowReceipt(true);
      setCart([]);
      fetchData();
    } catch (err) {
      console.error('Checkout error:', err.response?.data);
      alert(`Error: ${err.response?.data?.message || 'Failed to place order.'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      String(prod.category_id) === String(selectedCategory) ||
      String(prod.category?.category_id || prod.category?.id) === String(selectedCategory);

    const prodName = prod.product_name || prod.name || '';
    return matchesCategory && prodName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const currentModalPrice = selectedProduct
    ? calculateUnitPrice(selectedProduct.price, size)
    : 0;

  const hideSugar = selectedProduct ? isNoSugarProduct(selectedProduct) : false;

  return (
    <div className="flex h-full bg-slate-100 overflow-hidden relative">
      {/* ផ្នែកខាងឆ្វេង៖ Main Menu Layout */}
      <div className="flex-1 flex flex-col h-full p-6 overflow-hidden gap-4">
        
        {/* ១. Search Input (shrink-0 ការពារកុំឱ្យរួមទំហំ) */}
        <div className="shrink-0">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search coffee or menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>
        </div>

        {/* ២. Categories Bar (shrink-0 និង Scroll ដាច់ដោយឡែក) */}
        <div className="shrink-0 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              selectedCategory === 'ALL' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid size={16} /> All Items
          </button>
          {categories.map((cat) => {
            const catId = cat.category_id || cat.id;
            const catName = cat.category_name?.toLowerCase() || cat.name?.toLowerCase() || '';
            const Icon = CATEGORY_ICONS[cat.category_name || cat.name]
              || Object.entries(CATEGORY_ICONS).find(([key]) => catName.includes(key.toLowerCase()))?.[1]
              || Tag;
            return (
              <button
                key={catId}
                onClick={() => setSelectedCategory(catId)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === catId ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} /> {cat.category_name || cat.name}
              </button>
            );
          })}
        </div>

        {/* ៣. Products Grid (flex-1 overflow-y-auto សម្រាប់ Scroll តែផ្នែក Card ប៉ុណ្ណោះ) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-1">
          {filteredProducts.map((prod) => (
            <div
              key={prod.product_id || prod.id}
              onClick={() => openProductModal(prod)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition cursor-pointer flex flex-col justify-between h-fit"
            >
              <img
                src={prod.image ? `http://localhost:8000/storage/${prod.image}` : 'https://placehold.co/150?text=Coffee'}
                alt={prod.product_name}
                className="w-full h-32 object-cover rounded-xl mb-3"
              />
              <div>
                <h3 className="font-semibold text-slate-800 line-clamp-1">{prod.product_name || prod.name}</h3>
                <p className="text-emerald-600 font-bold mt-1">${parseFloat(prod.price || 0).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Summary Panel */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-lg h-full">
        <div className="p-5 border-b flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="text-emerald-600" /> Current Order
          </h2>
          <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 font-semibold">
            {cart.length} Items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.map((item) => (
            <div key={item.cartItemId} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border">
              <div>
                <h4 className="font-semibold text-sm">{item.product_name || item.name}</h4>
                <p className="text-[11px] text-slate-500">
                  {item.size}
                  {item.sugar_level ? ` \u2022 ${item.sugar_level}` : ''}
                </p>
                <p className="text-xs text-emerald-600 font-bold">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.cartItemId, -1)} className="p-1 border rounded cursor-pointer"><Minus size={14} /></button>
                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.cartItemId, 1)} className="p-1 border rounded cursor-pointer"><Plus size={14} /></button>
                <button onClick={() => removeFromCart(item.cartItemId)} className="p-1 text-rose-500 cursor-pointer"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t bg-slate-50 space-y-3 shrink-0">
          <div className="flex justify-between font-bold text-slate-800">
            <span>Total</span>
            <span className="text-emerald-600">${grandTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CreditCard size={18} /> {loading ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>

      {/* Dynamic Price Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                {selectedProduct.product_name || selectedProduct.name}
              </h3>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={selectedProduct.image ? `http://localhost:8000/storage/${selectedProduct.image}` : 'https://placehold.co/150?text=Coffee'}
                alt={selectedProduct.product_name}
                className="w-24 h-24 object-cover rounded-xl border"
              />
              <div>
                <span className="text-2xl font-extrabold text-emerald-600">
                  ${currentModalPrice.toFixed(2)}
                </span>
                <span className="block text-xs text-slate-400 mt-0.5">Size: {size}</span>
              </div>
            </div>

            {/* Sugar Level (hidden for non-drink categories) */}
            {!hideSugar && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Sugar Level</label>
                <div className="grid grid-cols-5 gap-2">
                  {['0%', '25%', '50%', '75%', '100%'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSugarLevel(lvl)}
                      className={`py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                        sugarLevel === lvl ? 'bg-emerald-700 text-white' : 'bg-white text-slate-600'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Options */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Size</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Small', label: 'Small (-$0.20)' },
                  { name: 'Medium', label: 'Medium (Default)' },
                  { name: 'Large', label: 'Large (+$0.50)' },
                ].map((sz) => (
                  <button
                    key={sz.name}
                    onClick={() => setSize(sz.name)}
                    className={`py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                      size === sz.name ? 'bg-emerald-700 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <button onClick={() => setItemQty((prev) => Math.max(1, prev - 1))} className="p-2 border rounded cursor-pointer"><Minus size={16} /></button>
              <span className="font-bold text-base w-8 text-center">{itemQty}</span>
              <button onClick={() => setItemQty((prev) => prev + 1)} className="p-2 border rounded cursor-pointer"><Plus size={16} /></button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setSelectedProduct(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">
                Cancel
              </button>
              <button onClick={handleAddToCart} className="flex-1 py-2.5 bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer">
                Add to Order (${(currentModalPrice * itemQty).toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && completedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl shadow-2xl font-mono text-slate-700 relative space-y-4">
            
            <button
              onClick={() => setShowReceipt(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="text-center pt-2 space-y-1">
              <h2 className="font-bold text-xl tracking-wider text-amber-600 uppercase">
                COFFEE POS
              </h2>
              <p className="text-xs text-slate-500">
                វិក្កយបត្រ / Official Receipt
              </p>

              <div className="py-2">
                <span className="text-4xl font-extrabold text-slate-800 tracking-wider">
                  {completedOrder.queueNumber}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 font-sans">
                {completedOrder.date}
              </p>
            </div>

            <div className="border-b border-dashed border-slate-300 my-2"></div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 font-semibold text-xs text-slate-600 border-b border-slate-300 pb-2">
                <span className="col-span-6">Item / Category</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              <div className="space-y-3 max-h-52 overflow-y-auto">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-xs items-center">
                    <div className="col-span-6">
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-sans">{item.categoryName || 'Coffee'}</p>
                    </div>
                    <span className="col-span-2 text-center font-medium">{item.qty}</span>
                    <span className="col-span-2 text-right font-medium">${item.price.toFixed(2)}</span>
                    <span className="col-span-2 text-right font-bold text-slate-800">
                      ${(item.qty * item.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-dashed border-slate-300 my-2"></div>

            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>សរុបចំនួន (Total Qty):</span>
                <span className="font-bold text-slate-800">
                  {completedOrder.items.reduce((sum, item) => sum + item.qty, 0)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-900 font-bold text-base pt-1">
                <span>សរុបដុល្លារ ($):</span>
                <span className="text-amber-600 text-lg font-extrabold">
                  ${completedOrder.subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-900 font-bold text-sm">
                <span>លុយខ្មែរ (KHR):</span>
                <span className="text-emerald-600 font-bold">
                  {(completedOrder.subtotal * EXCHANGE_RATE).toLocaleString()} ៛
                </span>
              </div>
            </div>

            <div className="border-b border-dashed border-slate-300 my-2"></div>

            <div className="pt-2 space-y-2.5 font-sans">
              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
              >
                <Printer size={16} /> Print Receipt
              </button>

              <button
                onClick={() => setShowReceipt(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close / បិទ
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}