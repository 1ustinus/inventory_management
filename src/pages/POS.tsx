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
  Monitor,
  Wifi,
  Smartphone,
  Cloud,
  CloudOff,
  RefreshCw,
  Database,
  ChevronUp,
  ChevronDown,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import * as ReactWindow from 'react-window';
import { AutoSizer as VirtualAutoSizer } from 'react-virtualized-auto-sizer';
import { localDb, STORAGE_KEYS } from '../lib/localDb';
import { firestoreDb } from '../lib/firestore';
import { Product, CartItem, PaymentMethod, Sale, User } from '../types';
import { formatCurrency, generateBarcode, cn } from '../lib/utils';
import { CATEGORIES, TAX_RATE } from '../constants';
import PaymentModal from '../components/PaymentModal';
import Receipt from '../components/Receipt';
import ScannerModal from '../components/ScannerModal';
import HotspotModal from '../components/HotspotModal';
import { hasPermission } from '../lib/permissions';
import { Shield } from 'lucide-react';
import { auth, db } from '../lib/firebase';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHotspotOpen, setIsHotspotOpen] = useState(false);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [stationId] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [discountType, setDiscountType] = useState<'none' | 'senior' | 'pwd'>('none');
  const [lastSale, setLastSale] = useState<any>(null);
  const [isCartVisible, setIsCartVisible] = useState(window.innerWidth > 768);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);

  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const authData = localStorage.getItem('flexi-auth');
    if (authData) setCurrentUser(JSON.parse(authData));

    const handleResize = () => setWindowWidth(window.innerWidth);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut: Ctrl + K (or Meta + K) to focus search/scanner
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        scanInputRef.current?.focus();
        scanInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Use Firestore for real-time product/stock updates
    const unsubscribe = firestoreDb.subscribe<Product>(STORAGE_KEYS.PRODUCTS, (data) => {
      setProducts(data.filter(p => p.stockQuantity > 0));
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const canAccess = hasPermission(currentUser, 'pos:access');

  const processScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (product) {
      addToCart(product);
      setLastScannedId(product.id || null);
      setScanError(null);
      
      // Auto-focus quantity input for the newly added/updated item
      setTimeout(() => {
        const qtyInput = document.querySelector(`[data-qty-input="${product.id}"]`) as HTMLInputElement;
        if (qtyInput) {
          qtyInput.focus();
        }
      }, 50);

      // Clear highlight after 2 seconds
      setTimeout(() => setLastScannedId(null), 2000);
      return true;
    }
    setScanError(`NOT_FOUND: ${barcode}`);
    setTimeout(() => setScanError(null), 3000);
    return false;
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          setScanError(`MAX STOCK REACHED: ${product.name}`);
          setTimeout(() => setScanError(null), 2000);
          return prev;
        }
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
        let newQty = item.quantity + delta;
        
        if (newQty > item.stockQuantity) {
          newQty = item.stockQuantity;
          setScanError(`STOCK LIMIT: ${item.name}`);
          setTimeout(() => setScanError(null), 2000);
        }
        
        newQty = Math.max(1, newQty);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = searchQuery.trim();
    if (!barcode) return;

    if (processScan(barcode)) {
      setSearchQuery('');
    }
    
    scanInputRef.current?.focus();
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.12;
  const discount = discountType !== 'none' ? subtotal * 0.20 : 0;
  const total = subtotal + tax - discount;

  const handlePayment = async (method: PaymentMethod, amountReceived: number) => {
    const saleData: any = {
      transactionId: `TXN-${Date.now()}`,
      cashierId: currentUser?.uid || auth.currentUser?.uid || 'unknown',
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
      setIsSyncing(true);
      await firestoreDb.add<Sale>(STORAGE_KEYS.SALES, saleData);
      
      // Update inventory stock in Firestore
      for (const item of cart) {
        const productRef = products.find(p => p.id === item.id);
        if (productRef) {
          await firestoreDb.update<Product>(STORAGE_KEYS.PRODUCTS, item.id, {
            stockQuantity: Math.max(0, productRef.stockQuantity - item.quantity),
            updatedAt: new Date().toISOString()
          });
        }
      }

      setLastSale(saleData);
      setCart([]);
      setDiscountType('none');
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Sale error:', error);
      setSyncError('Failed to commit sale to cloud');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Move item in cart
  const moveCartItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= cart.length) return;
    
    const newCart = [...cart];
    const item = newCart[index];
    newCart.splice(index, 1);
    newCart.splice(newIndex, 0, item);
    setCart(newCart);
  };

  const CartRow = React.memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: { items: CartItem[]; onRemove: (id: string) => void; onUpdate: (id: string, d: number) => void; onMove: (idx: number, dir: 'up' | 'down') => void; editingId: string | null; setEditingId: (id: string | null) => void; lastId: string | null; scanRef: React.RefObject<HTMLInputElement>; updateCart: React.Dispatch<React.SetStateAction<CartItem[]>> } }) => {
    const item = data.items[index];
    if (!item) return null;

    return (
      <div style={style} className="px-1 py-0.5">
        <div
          className={cn(
            "px-2 py-2 flex items-center gap-2 border border-gray-100 win-outset bg-white group font-bold italic transition-all duration-300 h-full",
            item.id === data.lastId ? "bg-green-50 ring-2 ring-green-500 ring-inset" : "hover:bg-blue-50"
          )}
        >
          <div className="flex flex-col gap-1 pr-1 border-r border-gray-100">
             <button 
               disabled={index === 0}
               onClick={() => data.onMove(index, 'up')}
               className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-20 translate-y-1"
             >
               <ChevronUp className="w-3 h-3" />
             </button>
             <button 
               disabled={index === data.items.length - 1}
               onClick={() => data.onMove(index, 'down')}
               className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-20 -translate-y-1"
             >
               <ChevronDown className="w-3 h-3" />
             </button>
          </div>

          <div className="w-10 h-10 win-outset bg-white rounded flex-shrink-0 flex items-center justify-center overflow-hidden relative">
             {item.imageUrl ? (
               <img 
                src={item.imageUrl} 
                alt="" 
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-300" 
               />
             ) : (
               <Package className="w-6 h-6 text-gray-200" />
             )}
             {item.stockQuantity < (item.minStockLevel || 5) && (
               <div className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full border border-white" />
             )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h4 className="text-[10px] truncate uppercase text-[var(--color-win-text)]">{item.name}</h4>
              <button 
                onClick={() => data.onRemove(item.id)}
                className="text-gray-400 hover:text-red-700 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-center gap-1">
                     <button 
                       onClick={() => data.onUpdate(item.id, -1)} 
                       className="win-button w-6 h-6 flex items-center justify-center"
                     >
                       <Minus className="w-2.5 h-2.5" />
                     </button>
                     
                     <div className="relative">
                       {data.editingId === item.id ? (
                         <input 
                           type="number"
                           min="1"
                           max={item.stockQuantity}
                           autoFocus
                           className={cn(
                             "win-input w-8 h-6 text-[10px] font-black text-center p-0",
                             item.quantity >= item.stockQuantity ? "text-red-700" : "text-blue-700"
                           )}
                           value={item.quantity}
                           onChange={(e) => {
                             const val = parseInt(e.target.value);
                             if (!isNaN(val) && val > 0) {
                               const finalVal = Math.min(val, item.stockQuantity);
                               if (val > item.stockQuantity) {
                                  // Feedback? Maybe just cap it
                               }
                               data.updateCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: finalVal } : i));
                             }
                           }}
                           onBlur={() => data.setEditingId(null)}
                           onFocus={(e) => e.target.select()}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               data.setEditingId(null);
                               data.scanRef.current?.focus();
                             }
                           }}
                         />
                       ) : (
                         <button
                           onClick={() => data.setEditingId(item.id)}
                           className={cn(
                             "win-button min-w-8 h-6 px-1 text-[10px] font-black flex items-center justify-center hover:bg-blue-100 transition-colors",
                             item.quantity >= item.stockQuantity ? "text-red-700" : "text-blue-700"
                           )}
                         >
                           {item.quantity}
                         </button>
                        )}
                     </div>

                     <button 
                       disabled={item.quantity >= item.stockQuantity}
                       onClick={() => data.onUpdate(item.id, 1)} 
                       className={cn(
                         "win-button w-6 h-6 flex items-center justify-center",
                         item.quantity >= item.stockQuantity && "opacity-30 cursor-not-allowed"
                       )}
                     >
                       <Plus className="w-2.5 h-2.5" />
                     </button>
                  </div>
              <span className="font-bold text-[10px] text-gray-800">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  });

  const cartItemData = React.useMemo(() => ({
    items: cart,
    onRemove: removeFromCart,
    onUpdate: updateQuantity,
    onMove: moveCartItem,
    editingId: editingQtyId,
    setEditingId: setEditingQtyId,
    lastId: lastScannedId,
    scanRef: scanInputRef,
    updateCart: setCart
  }), [cart, editingQtyId, lastScannedId]);

  const FixedSizeList = (ReactWindow as any).FixedSizeList;
  const AutoSizer = VirtualAutoSizer as any;

  return (
    <div className="h-full min-h-0 flex flex-col md:flex-row overflow-hidden bg-[var(--color-win-bg)] p-1 md:p-2 gap-1 md:gap-2 relative">
      {/* Sidebar: Cart Area */}
      <AnimatePresence>
        {isCartVisible && (
          <motion.div 
            initial={{ x: windowWidth < 768 ? '100%' : -100, opacity: 0 }}
            animate={{ 
              width: windowWidth < 768 ? '100%' : (windowWidth < 1200 ? 320 : 400), 
              opacity: 1, 
              x: 0,
              position: windowWidth < 768 ? 'fixed' : 'relative',
              zIndex: windowWidth < 768 ? 100 : 1,
              height: '100%',
              top: 0,
              right: 0,
            }}
            exit={{ x: windowWidth < 768 ? '100%' : -100, opacity: 0 }}
            className="win-outset flex flex-col bg-[var(--color-win-bg)] p-1 shrink-0 overflow-hidden shadow-2xl md:shadow-none"
          >
            <div className="win-header sticky top-0 z-10 flex justify-between items-center px-2 py-1.5 mb-1 shadow-sm">
               <div className="flex items-center gap-2">
                 <ShoppingCart className="w-3.5 h-3.5" />
                 <span className="font-bold text-[11px] uppercase tracking-tighter">Register_Output</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="bg-white/20 px-1.5 py-0.5 win-inset text-[9px] font-bold uppercase">{cart.length} ITEMS</span>
                 <button 
                  onClick={() => setIsCartVisible(false)} 
                  className="win-button p-0.5 h-6 w-6 flex items-center justify-center font-black text-xs"
                 >X</button>
               </div>
            </div>

            <div className="flex-1 win-inset bg-white custom-scrollbar overflow-hidden relative">
              {cart.length > 0 ? (
                <AutoSizer>
                  {({ height, width }: any) => (
                    <FixedSizeList
                      height={height}
                      width={width}
                      itemCount={cart.length}
                      itemSize={72}
                      itemData={cartItemData}
                      className="custom-scrollbar"
                    >
                      {CartRow}
                    </FixedSizeList>
                  )}
                </AutoSizer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 opacity-30 text-center uppercase font-black italic">
                  <ShoppingCart className="w-12 h-12 mb-4" />
                  <p className="text-[10px] tracking-[0.2em]">Scanner Standing By...</p>
                </div>
              )}
            </div>

            {/* Totals & Actions */}
            <div className="p-3 bg-[var(--color-win-bg)] space-y-3 mt-auto win-outset sticky bottom-0 z-10 border-t border-[var(--color-win-dark)]/10 shadow-sm">
                <div className="grid grid-cols-3 gap-1.5">
                   <button 
                     onClick={() => setDiscountType(prev => prev === 'senior' ? 'none' : 'senior')}
                     className={cn(
                       "win-button text-[9px] font-black py-2",
                       discountType === 'senior' && "bg-white/50 text-[var(--color-win-blue)] shadow-inner"
                     )}
                   >
                     SENIOR
                   </button>
                   <button 
                     onClick={() => setDiscountType(prev => prev === 'pwd' ? 'none' : 'pwd')}
                     className={cn(
                       "win-button text-[9px] font-black py-2",
                       discountType === 'pwd' && "bg-white/50 text-[var(--color-win-blue)] shadow-inner"
                     )}
                   >
                     PWD
                   </button>
                   <button onClick={() => { if(confirm('Wipe register state?')) setCart([]); }} className="win-button p-2 flex items-center justify-center text-red-700">
                      <RotateCcw className="w-4 h-4" />
                   </button>
                </div>

                <div className="space-y-1 text-[11px] font-bold border-2 border-dotted border-[var(--color-win-dark)] p-3 bg-white/40 italic">
                  <div className="flex justify-between text-gray-700">
                    <span>INDEX_SUBTOTAL</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>TAX_SURCHARGE</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[var(--color-win-blue)] border-t border-blue-900/20 pt-1">
                      <span>APPLIED_REDUCTION</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t-2 border-[var(--color-win-dark)]">
                    <span className="text-[10px] font-black text-[var(--color-win-text)] tracking-wider">PAYABLE_TOTAL:</span>
                    <span className="text-2xl font-black text-[var(--color-win-blue)] tracking-tighter">₱{total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  disabled={cart.length === 0}
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="win-button w-full py-4 text-[var(--color-win-blue)] disabled:text-gray-400 font-black text-sm flex items-center justify-center gap-3 uppercase tracking-[0.2em] border-2 shadow-lg"
                >
                  <CreditCard className="w-5 h-5" /> CHECKOUT
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Area: Search and Products */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Responsive Header */}
        <div className="win-outset bg-[var(--color-win-bg)] p-1 pb-2 shrink-0 mb-1">
          <div className="win-header mb-1 px-2 py-1.5 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest mr-1">Visual_Catalog_System</span>
                
                <div 
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 win-inset text-[8px] font-black uppercase transition-all duration-500",
                    isOnline 
                      ? (syncError ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800")
                      : "bg-amber-100 text-amber-800"
                  )}
                  title={syncError ? `Sync Error: ${syncError}` : (lastSyncTime ? `Last sync: ${lastSyncTime}` : 'Offline Mode Active')}
                >
                  {isOnline ? (
                    syncError ? <Database className="w-2.5 h-2.5" /> : <Cloud className="w-2.5 h-2.5" />
                  ) : (
                    <CloudOff className="w-2.5 h-2.5" />
                  )}
                  
                  <span className="hidden sm:inline">
                    {isOnline ? (syncError ? 'Sync_Error' : 'Online') : 'Offline'}
                  </span>
                </div>
             </div>
             <button 
              onClick={() => setIsCartVisible(!isCartVisible)}
              className="win-button px-2 py-0.5 text-[9px] font-black uppercase flex items-center gap-1 whitespace-nowrap"
             >
                <ShoppingCart className="w-3 h-3" />
                <span className="hidden sm:inline">Toggle View</span>
                {cart.length > 0 && <span className="bg-[var(--color-win-blue)] text-white px-1 ml-1">{cart.length}</span>}
             </button>
          </div>
          
          <div className="px-2 space-y-2">
             <div className="flex flex-col sm:flex-row gap-2">
                <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
                   <input
                     ref={scanInputRef}
                     type="text"
                     placeholder="Scan Barcode / Search Item... (Ctrl+K)"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className={cn(
                       "win-input w-full h-9 pl-10 text-[12px] font-bold transition-all",
                       scanError && "border-red-600 bg-red-50"
                     )}
                   />
                   <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <AnimatePresence>
                     {scanError && (
                       <motion.div 
                         initial={{ opacity: 0, y: 5 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0 }}
                         className="absolute -bottom-5 left-0 right-0 text-center z-10"
                       >
                         <span className="bg-red-600 text-white text-[8px] font-black uppercase px-2 py-0.5 tracking-widest shadow-sm">
                           {scanError}
                         </span>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </form>
                <div className="flex gap-2">
                   <div className="hidden sm:flex win-inset bg-white/40 px-3 flex flex-col justify-center items-center min-w-[100px] h-9">
                      <span className="text-[7px] font-black text-gray-600 uppercase leading-none mb-0.5">CURRENT_REV</span>
                      <span className="text-[12px] font-black text-[var(--color-win-blue)] leading-none italic">₱ 8,420.00</span>
                   </div>
                   <button 
                     onClick={() => setIsScannerOpen(true)}
                     className="win-button h-9 px-3 flex items-center justify-center gap-2"
                     title="Camera Scanner"
                   >
                      <Scan className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase italic">Scan</span>
                   </button>
                   <button 
                     onClick={() => setIsHotspotOpen(true)}
                     className="win-button h-9 px-3 flex items-center justify-center gap-2 text-blue-700"
                     title="Remote Scanner Hotspot"
                   >
                      <Wifi className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase italic">Link</span>
                   </button>
                </div>
             </div>

             <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar scroll-smooth no-scrollbar">
               {['All', ...CATEGORIES.map(c => c.name)].map((cat) => (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={cn(
                     "win-button px-4 py-1.5 text-[9px] font-black uppercase tracking-tight whitespace-nowrap transition-all",
                     selectedCategory === cat ? "bg-white text-[var(--color-win-blue)] border-2 border-dotted shadow-inner" : "opacity-70"
                   )}
                 >
                   {cat}
                 </button>
               ))}
             </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto win-inset bg-white p-2 sm:p-3 custom-scrollbar">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="win-outset p-1.5 sm:p-2 bg-[var(--color-win-bg)] hover:bg-blue-50 transition-all flex flex-col items-start text-left relative group active:scale-[0.98]"
                >
                  <div className="w-full aspect-square win-inset bg-white mb-2 overflow-hidden relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-100">
                        <Package className="w-8 h-8 opacity-10" />
                      </div>
                    )}
                    {product.stockQuantity <= (product.minStockLevel || 10) && (
                      <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-red-600 text-white text-[7px] font-black uppercase tracking-widest shadow-lg">
                        LOW
                      </div>
                    )}
                  </div>
                  <div className="w-full min-h-[40px]">
                    <p className="text-[7px] font-black text-gray-500 uppercase mb-0.5 tracking-[0.1em]">{product.category}</p>
                    <h4 className="text-[11px] font-black text-[var(--color-win-text)] uppercase line-clamp-2 leading-tight tracking-tighter italic">{product.name}</h4>
                  </div>
                  <div className="w-full flex justify-between items-end mt-2 pt-1 border-t border-gray-300">
                    <p className="text-sm font-black text-[var(--color-win-blue)]">₱{product.price.toLocaleString()}</p>
                    <p className={cn(
                      "text-[8px] font-bold uppercase",
                      product.stockQuantity < 5 ? "text-red-700" : "text-gray-500"
                    )}>S:{product.stockQuantity}</p>
                  </div>
                </button>
              ))}
           </div>
           
           {filteredProducts.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dotted">
                <Search className="w-12 h-12 mb-4 opacity-5" />
                <p className="text-xs font-black uppercase tracking-[0.3em]">No Catalog Hits</p>
             </div>
           )}
        </div>

        {/* Mobile Quick Checkout Trigger */}
        {!isCartVisible && cart.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="md:hidden p-3 bg-[var(--color-win-bg)] border-t-2 border-[var(--color-win-dark)] flex gap-2"
          >
             <button
               onClick={() => setIsCartVisible(true)}
               className="win-button flex-1 py-3 bg-[var(--color-win-blue)] text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl"
             >
                <ShoppingCart className="w-5 h-5" /> View Register ({cart.length})
             </button>
             <div className="win-inset bg-white px-4 flex flex-col justify-center items-end min-w-[120px]">
                <span className="text-[8px] font-black text-gray-500 uppercase">PAYABLE</span>
                <span className="text-lg font-black text-[var(--color-win-blue)] leading-none italic">₱{total.toLocaleString()}</span>
             </div>
          </motion.div>
        )}
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={total}
        onConfirm={handlePayment}
      />

      <ScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={processScan} 
      />

      <HotspotModal 
        isOpen={isHotspotOpen} 
        onClose={() => setIsHotspotOpen(false)} 
        stationId={stationId} 
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
