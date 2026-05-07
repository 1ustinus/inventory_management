import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Minus, 
  Plus, 
  Trash2, 
  RotateCcw, 
  PauseCircle, 
  PhilippinePeso,
  Scan,
  UserCheck,
  Tag,
  CreditCard,
  Printer,
  ShoppingCart,
  Package,
  Terminal,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { localDb, STORAGE_KEYS } from '../lib/localDb';
import { Product, CartItem, PaymentMethod, Sale, User } from '../types';
import { formatCurrency, generateBarcode, cn } from '../lib/utils';
import { CATEGORIES, TAX_RATE } from '../constants';
import PaymentModal from '../components/PaymentModal';
import Receipt from '../components/Receipt';
import { hasPermission } from '../lib/permissions';
import { Shield } from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'none' | 'senior' | 'pwd'>('none');
  const [lastSale, setLastSale] = useState<any>(null);
  const [isCartVisible, setIsCartVisible] = useState(window.innerWidth > 768);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const authData = localStorage.getItem('flexi-auth');
    if (authData) setCurrentUser(JSON.parse(authData));

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    fetchProducts();
    window.addEventListener('storage_update', fetchProducts);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('storage_update', fetchProducts);
    };
  }, []);

  const canAccess = hasPermission(currentUser, 'pos:access');

  if (!canAccess && currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
         <motion.div 
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="win-outset p-8 md:p-12 flex flex-col items-center bg-[var(--color-win-bg)] shadow-2xl max-w-lg w-full"
         >
            <div className="win-header w-full mb-6 !bg-red-900 px-2 py-1 flex items-center gap-2">
               <Shield className="w-3.5 h-3.5 text-white" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Access_Denied_Terminal</span>
            </div>
            
            <div className="win-inset bg-white p-6 flex flex-col items-center mb-6 w-full">
               <Shield className="w-16 h-16 text-red-700 mb-4 animate-pulse opacity-20" />
               <h2 className="text-xl font-black text-red-700 uppercase italic tracking-widest border-b-4 border-red-700 pb-2 mb-4 text-center">Protocol Violation</h2>
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter text-center italic">
                 Identity signature [{(currentUser?.displayName || 'UNKNOWN').toUpperCase()}] lacks required operative clearances (pos:access).
               </p>
            </div>

            <div className="w-full flex justify-center">
               <button 
                 onClick={() => window.location.hash = '#/'}
                 className="win-button px-10 py-2 text-[10px] font-black uppercase text-blue-900 border-blue-900 shadow-[4px_4px_0] shadow-blue-900/20 active:translate-y-[2px]"
               >
                 Return to Dashboard
               </button>
            </div>
         </motion.div>
      </div>
    );
  }

  const fetchProducts = async () => {
    const data = localDb.getAll<Product>(STORAGE_KEYS.PRODUCTS);
    setProducts(data.filter(p => p.stockQuantity > 0));
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = searchQuery.trim();
    const product = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (product) {
      addToCart(product);
      setSearchQuery('');
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.12;
  const discount = discountType !== 'none' ? subtotal * 0.20 : 0;
  const total = subtotal + tax - discount;

  const handlePayment = async (method: PaymentMethod, amountReceived: number) => {
    const currentUser = JSON.parse(localStorage.getItem('flexi-auth') || '{}');
    const saleData: Sale = {
      id: Math.random().toString(36).substring(7),
      transactionId: `TXN-${Date.now()}`,
      cashierId: currentUser.uid || 'demo-manager',
      items: cart,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod: method,
      amountReceived,
      change: amountReceived - total,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    try {
      localDb.add<Sale>(STORAGE_KEYS.SALES, saleData);
      
      // Update inventory stock
      for (const item of cart) {
        const current = localDb.getOne<Product>(STORAGE_KEYS.PRODUCTS, item.id);
        if (current) {
          localDb.update<Product>(STORAGE_KEYS.PRODUCTS, item.id, {
            stockQuantity: Math.max(0, current.stockQuantity - item.quantity),
            updatedAt: new Date().toISOString()
          });
        }
      }

      setLastSale(saleData);
      setCart([]);
      setDiscountType('none');
      fetchProducts();
    } catch (error) {
      console.error('Sale error:', error);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full min-h-0 flex overflow-hidden bg-[var(--color-win-bg)] p-2 gap-2 relative">
      {/* Sidebar: Cart Area */}
      <AnimatePresence>
        {isCartVisible && (
          <motion.div 
            initial={{ width: 0, opacity: 0, x: -50 }}
            animate={{ 
              width: windowWidth < 768 ? '100%' : (windowWidth < 1200 ? 350 : 450), 
              opacity: 1, 
              x: 0,
              position: windowWidth < 768 ? 'absolute' : 'relative',
              zIndex: windowWidth < 768 ? 60 : 1,
              height: windowWidth < 768 ? '100%' : 'auto',
              top: 0,
              left: 0
            }}
            exit={{ width: 0, opacity: 0, x: -50 }}
            className="win-outset flex flex-col bg-[var(--color-win-bg)] p-1 shrink-0 overflow-hidden shadow-2xl md:shadow-none"
          >
            <div className="win-header flex justify-between items-center px-2 py-1 mb-1">
               <div className="flex items-center gap-2">
                 <Terminal className="w-3.5 h-3.5" />
                 <span className="font-bold text-[11px] uppercase">Transaction Terminal_01</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="bg-white/20 px-1.5 py-0.5 win-inset text-[9px] font-bold uppercase">{cart.length} UNITS</span>
                 <button onClick={() => setIsCartVisible(false)} className="md:hidden win-button p-0.5 h-5 w-5 flex items-center justify-center">X</button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 win-inset bg-white custom-scrollbar">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="px-2 py-1 flex items-center gap-2 border-b border-gray-100 hover:bg-blue-50 group font-bold italic"
                >
                  <div className="w-8 h-8 win-outset bg-white rounded flex-shrink-0 flex items-center justify-center">
                     <Package className="w-5 h-5 text-gray-400 opacity-40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-[11px] truncate uppercase text-[var(--color-win-text)]">{item.name}</h4>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                         <button onClick={() => updateQuantity(item.id, -1)} className="win-button p-1 md:p-1.5"><Minus className="w-3 h-3" /></button>
                         <span className="text-[11px] font-black text-blue-700 w-4 text-center">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.id, 1)} className="win-button p-1 md:p-1.5"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-bold text-gray-800">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10 text-center uppercase tracking-widest font-black italic">
                  <ShoppingCart className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-[10px] opacity-40">No Units Logged</p>
                </div>
              )}
            </div>

            {/* Totals & Actions */}
            <div className="p-3 bg-[var(--color-win-bg)] space-y-3 mt-1 win-outset mt-auto">
                <div className="grid grid-cols-3 gap-1">
                   <button 
                     onClick={() => setDiscountType(prev => prev === 'senior' ? 'none' : 'senior')}
                     className={cn(
                       "win-button text-[9px] font-black py-1",
                       discountType === 'senior' && "bg-white/50 text-[var(--color-win-blue)]"
                     )}
                   >
                     SENIOR [S]
                   </button>
                   <button 
                     onClick={() => setDiscountType(prev => prev === 'pwd' ? 'none' : 'pwd')}
                     className={cn(
                       "win-button text-[9px] font-black py-1",
                       discountType === 'pwd' && "bg-white/50 text-[var(--color-win-blue)]"
                     )}
                   >
                     PWD [P]
                   </button>
                   <button onClick={() => setCart([])} className="win-button p-1 flex items-center justify-center text-red-700">
                      <RotateCcw className="w-3.5 h-3.5" />
                   </button>
                </div>

                <div className="space-y-1 text-[11px] font-bold border-2 border-dotted border-[var(--color-win-dark)] p-2 bg-white/30 italic">
                  <div className="flex justify-between text-gray-800">
                    <span>SUBTOTAL</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-800">
                    <span>VAT-EXEMPT</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[var(--color-win-blue)]">
                      <span>DISCOUNTED</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-[var(--color-win-dark)]">
                    <span className="text-[10px] font-black text-[var(--color-win-text)]">PAYABLE:</span>
                    <span className="text-2xl font-black text-[var(--color-win-blue)] tracking-tighter italic">₱{total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  disabled={cart.length === 0}
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="win-button w-full py-4 text-[var(--color-win-blue)] disabled:text-gray-400 font-bold text-sm flex items-center justify-center gap-2 uppercase tracking-widest border-2 underline"
                >
                  <CreditCard className="w-5 h-5" /> COMPLETE SETTLEMENT
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Cart Button */}
      {!isCartVisible && (
        <button 
          onClick={() => setIsCartVisible(true)}
          className="absolute left-4 bottom-4 z-50 win-button p-3 rounded-full bg-[var(--color-win-blue)] text-white shadow-xl hover:scale-110 transition-all"
          title="Open Register"
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{cart.length}</span>}
        </button>
      )}

      {/* Main Area: Search and Products */}
      <div className="flex-1 flex flex-col gap-2 transition-all duration-300 min-w-0 pr-0 md:pr-2">
        <div className="win-outset bg-[var(--color-win-bg)] p-1 shrink-0">
          <div className="win-header mb-1 px-2 py-1 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Catalog Visualization System</span>
             </div>
             <button 
              onClick={() => setIsCartVisible(!isCartVisible)}
              className="win-button px-2 py-0.5 text-[9px] font-bold uppercase flex items-center gap-1"
             >
                {isCartVisible ? 'Maximize display' : 'Restore layout'}
             </button>
          </div>
          
          <div className="flex gap-2 px-2 pb-1">
             <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
                <input
                  ref={scanInputRef}
                  type="text"
                  placeholder="Scan Barcode or Search Index..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="win-input w-full h-8 pl-9 text-[11px] font-bold"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
             </form>
             <div className="hidden md:flex gap-1">
                <div className="win-inset bg-white/40 px-3 flex flex-col justify-center items-center min-w-[80px]">
                   <span className="text-[7px] font-black text-gray-700 uppercase">Rev_Shift</span>
                   <span className="text-[10px] font-black text-[var(--color-win-blue)] tracking-tight italic">₱ 8,420.00</span>
                </div>
             </div>
          </div>

          <div className="flex gap-1 overflow-x-auto px-2 pb-1 custom-scrollbar">
            {['All', ...CATEGORIES.map(c => c.name)].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "win-button px-3 py-0.5 text-[9px] font-black uppercase tracking-tight whitespace-nowrap",
                  selectedCategory === cat && "bg-white/50 text-[var(--color-win-blue)] border-2 border-dotted"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto win-inset bg-white p-2 custom-scrollbar">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="win-outset p-1.5 bg-[var(--color-win-bg)] hover:bg-blue-50 transition-all flex flex-col items-start text-left relative group active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  <div className="w-full aspect-square win-inset bg-white mb-1.5 overflow-hidden relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain grayscale-[20%] group-hover:grayscale-0 transition-all" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <Package className="w-6 h-6 opacity-10" />
                      </div>
                    )}
                    {product.stockQuantity <= (product.minStockLevel || 10) && (
                      <div className="absolute top-0.5 left-0.5 px-1 py-0 bg-red-100 border border-red-700 text-[6px] font-black text-red-700 uppercase">
                        CRITICAL
                      </div>
                    )}
                  </div>
                  <p className="text-[7px] font-black text-gray-700 uppercase mb-0.5 leading-none">{product.category}</p>
                  <h4 className="text-[10px] font-black text-[var(--color-win-text)] uppercase line-clamp-2 mb-1 italic h-6 leading-tight">{product.name}</h4>
                  <div className="w-full flex justify-between items-baseline mt-auto border-t border-[var(--color-win-dark)] pt-0.5">
                    <p className="text-xs font-black text-[var(--color-win-blue)] italic">₱{product.price.toLocaleString()}</p>
                    <p className="text-[7px] font-bold text-gray-700 uppercase">QTY:{product.stockQuantity}</p>
                  </div>
                </button>
              ))}
           </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={total}
        onConfirm={handlePayment}
      />

      <AnimatePresence>
        {lastSale && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="win-outset p-1 bg-[var(--color-win-bg)] max-w-sm w-full shadow-2xl"
            >
              <div className="win-header flex justify-between items-center px-2 py-1 mb-1">
                 <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    <h3 className="text-[11px] font-bold">Voucher Printing Subsystem</h3>
                 </div>
                 <button onClick={() => setLastSale(null)} className="win-button px-1 h-5 w-5 text-xs">X</button>
              </div>

              <div className="p-4 bg-[var(--color-win-bg)]">
                 <div className="win-inset bg-white p-4 text-gray-800 max-h-[450px] overflow-y-auto mb-4 custom-scrollbar">
                    <Receipt sale={lastSale} />
                 </div>

                 <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        window.print();
                        setLastSale(null);
                      }}
                      className="win-button flex-1 py-2 font-black uppercase text-xs flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" /> Print Copy
                    </button>
                    <button 
                      onClick={() => setLastSale(null)}
                      className="win-button px-6 py-2 font-black uppercase text-xs"
                    >
                      Exit
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
