import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit3, 
  Trash2,
  ArrowUpDown,
  Download,
  AlertTriangle,
  History,
  Tag,
  Barcode as BarcodeIcon,
  Layers,
  Terminal,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { localDb, STORAGE_KEYS } from '../lib/localDb';
import { Product, User } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { CATEGORIES } from '../constants';
import { hasPermission } from '../lib/permissions';

import ProductModal from '../components/ProductModal';

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isStatsMinimized, setIsStatsMinimized] = useState(false);
  const [isTableMinimized, setIsTableMinimized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const authData = localStorage.getItem('flexi-auth');
    if (authData) setCurrentUser(JSON.parse(authData));

    const updateInventory = () => {
      setProducts(localDb.getAll<Product>(STORAGE_KEYS.PRODUCTS));
    };
    updateInventory();
    window.addEventListener('storage_update', updateInventory);
    return () => window.removeEventListener('storage_update', updateInventory);
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.barcode && p.barcode.includes(searchQuery)) || 
                         (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const canEdit = hasPermission(currentUser, 'inventory:edit');
  const canDelete = hasPermission(currentUser, 'inventory:delete');
  const canView = hasPermission(currentUser, 'inventory:view');

  const handleDelete = async (id: string) => {
    if (confirm('Decommission this product record from the inventory vault?')) {
      try {
        localDb.delete(STORAGE_KEYS.PRODUCTS, id);
        // Explicitly refresh state for immediate UI response
        setProducts(localDb.getAll<Product>(STORAGE_KEYS.PRODUCTS));
      } catch (err) {
        console.error('Deletion failure:', err);
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto bg-[var(--color-win-bg)] min-h-screen font-sans">
      <header className="win-outset p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--color-win-bg)]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <h1 className="text-sm font-black text-[var(--color-win-text)] tracking-tight uppercase italic underline decoration-2">Warehouse_DB / Inventory Control Node</h1>
        </div>
        <div className="flex gap-2">
          <button className="win-button px-4 py-1 text-[10px] font-black uppercase flex items-center gap-2">
            <Download className="w-3.5 h-3.5" /> Dump Data
          </button>
          {canEdit && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="win-button px-4 py-1 text-[10px] bg-white text-[var(--color-win-blue)] font-black uppercase flex items-center gap-2 underline"
            >
              <Plus className="w-3.5 h-3.5" /> Register New Item
            </button>
          )}
        </div>
      </header>

      <ProductModal isOpen={isModalOpen} onClose={closeModal} editingProduct={editingProduct} />

      {/* Stats Area */}
      <div className="win-outset p-1 bg-[var(--color-win-bg)]">
        <div className="win-header flex justify-between items-center px-2 py-0.5 mb-1 text-[10px] font-bold">
          <span>REAL_TIME_METRICS</span>
          <button onClick={() => setIsStatsMinimized(!isStatsMinimized)} className="win-button h-4 w-4 flex items-center justify-center text-[10px] p-0">
            {isStatsMinimized ? '□' : '_'}
          </button>
        </div>
        
        <AnimatePresence>
          {!isStatsMinimized && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-1 overflow-hidden"
            >
              {[
                { label: 'Cluster Groups', value: CATEGORIES.length, icon: Layers, color: 'blue' },
                { label: 'Valuation Index', value: formatCurrency(products.reduce((acc, p) => acc + (p.price * p.stockQuantity), 0)), icon: Tag, color: 'blue' },
                { label: 'Critical Alerts', value: products.filter(p => p.stockQuantity <= (p.minStockLevel || 10)).length, icon: AlertTriangle, color: 'blue' },
                { label: 'Unit Stock Total', value: products.reduce((acc, p) => acc + p.stockQuantity, 0), icon: Package, color: 'blue' },
              ].map((stat, idx) => (
                <div key={idx} className="win-inset bg-white p-3 flex items-center gap-4 group">
                  <div className="p-2 win-outset bg-[var(--color-win-bg)]">
                    <stat.icon className="w-4 h-4 text-[var(--color-win-blue)] group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                    <p className="text-sm font-black text-[var(--color-win-text)] tracking-tighter italic">{stat.value}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="win-outset p-1 bg-[var(--color-win-bg)]">
        <div className="win-header px-2 py-0.5 mb-1 text-[10px] font-bold flex justify-between items-center">
          <span>ITEM_CATALOG_EXPLORER</span>
          <button onClick={() => setIsTableMinimized(!isTableMinimized)} className="win-button h-4 w-4 flex items-center justify-center text-[10px] p-0">
            {isTableMinimized ? '□' : '_'}
          </button>
        </div>
        
        <AnimatePresence>
          {!isTableMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-2 flex flex-col md:flex-row gap-2 items-center bg-[var(--color-win-bg)] border-b border-[var(--color-win-dark)]">
                <div className="flex-1 w-full relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search Index: Name / Barcode / SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="win-input w-full pl-9 h-7 text-[11px] font-bold"
                  />
                </div>
                <div className="flex gap-1 w-full md:w-auto">
                  <select 
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="win-input h-7 px-2 text-[10px] font-black uppercase tracking-tight bg-white min-w-[200px]"
                  >
                    <option value="">ALL CLUSTERS</option>
                    {CATEGORIES.map(c => <option key={c.code} value={c.name}>{c.name.toUpperCase()}</option>)}
                  </select>
                  {canEdit && (
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="win-button px-3 h-7 text-[9px] bg-blue-100 text-blue-800 font-black uppercase flex items-center gap-1 shrink-0"
                      title="Quick Register"
                    >
                      <Plus className="w-3 h-3" /> Quick Add
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto win-inset bg-white custom-scrollbar">
                <table className="w-full text-left text-[11px] min-w-[800px]">
                  <thead className="bg-[#D4D4D4] sticky top-0 z-10">
                    <tr className="text-gray-700 tracking-tight font-black uppercase border-b border-gray-400">
                      <th className="px-4 py-2 border-r border-gray-300 italic">Catalog Entry</th>
                      <th className="px-4 py-2 border-r border-gray-300 italic">Tag</th>
                      <th className="px-4 py-2 border-r border-gray-300 italic">Serial/GS1</th>
                      <th className="px-4 py-2 border-r border-gray-300 italic">Level</th>
                      <th className="px-4 py-2 border-r border-gray-300 italic">Price</th>
                      <th className="px-4 py-2 text-right">
                        <div className="flex flex-col items-end">
                           <span className="italic text-[10px] text-blue-900 font-black decoration-blue-700/50 underline-offset-4">OPS</span>
                           <span className="text-[7px] text-gray-500 font-bold uppercase tracking-tighter opacity-50">CTRL_CENTER</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 italic">
                     <AnimatePresence mode="popLayout">
                      {filteredProducts.map((p) => {
                        const isLow = p.stockQuantity <= (p.minStockLevel || 10);
                        return (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={p.id} 
                            className={cn(
                              "group transition-all even:bg-gray-50/5",
                              isLow ? "bg-red-50/50 hover:bg-red-100/60 border-l-2 border-l-red-600" : "hover:bg-blue-50"
                            )}
                          >
                            <td className="px-4 py-2 border-r border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 win-outset bg-white p-0.5 flex-shrink-0 overflow-hidden">
                                   {p.imageUrl ? (
                                     <img src={p.imageUrl} className="w-full h-full object-contain grayscale-[30%]" alt={p.name} />
                                   ) : (
                                     <div className="w-full h-full flex items-center justify-center text-gray-200">
                                       <Package className="w-4 h-4 opacity-10" />
                                     </div>
                                   )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    {isLow && <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />}
                                    <p className="font-black text-[var(--color-win-text)] uppercase truncate leading-none">{p.name}</p>
                                  </div>
                                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter italic">{p.sku}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2 border-r border-gray-100">
                               <span className="text-[9px] font-black text-gray-700 uppercase border-b border-dotted border-gray-400">
                                 {p.category}
                               </span>
                            </td>
                            <td className="px-4 py-2 border-r border-gray-100">
                               <div className="flex items-center gap-2 text-gray-600 group-hover:text-[var(--color-win-blue)] transition-colors">
                                 <BarcodeIcon className="w-3 h-3 opacity-60 font-black" />
                                 <span className="font-mono text-[10px] font-bold tracking-tighter uppercase">{p.barcode}</span>
                                </div>
                            </td>
                            <td className="px-4 py-2 border-r border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-black text-[10px]",
                                  isLow ? "text-red-700" : "text-emerald-700"
                                )}>
                                  {p.stockQuantity} {p.unit || 'UNITS'}
                                </span>
                                {isLow && (
                                  <div className="px-1 bg-red-100 text-red-700 text-[8px] font-black border border-red-700 animate-pulse">L_STOCK</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 border-r border-gray-100">
                               <div className="flex flex-col leading-none">
                                 <span className="font-black text-[var(--color-win-blue)] text-xs tracking-tighter italic">₱{p.price.toLocaleString()}</span>
                                 <span className="text-[8px] font-bold text-gray-600 italic">{formatCurrency(p.costPrice)}</span>
                               </div>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex justify-end gap-1.5 items-center">
                                {canEdit && (
                                  <button 
                                    onClick={() => handleEdit(p)}
                                    className="win-button p-1 text-[var(--color-win-blue)] hover:bg-blue-50"
                                    title="Edit Record"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button 
                                    onClick={() => handleDelete(p.id)}
                                    className="win-button p-1 text-red-700 hover:bg-red-50"
                                    title="Decommission Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {!canEdit && !canDelete && (
                                  <button 
                                    className="win-button p-1 text-gray-400 opacity-50 cursor-not-allowed"
                                    title="Access Denied"
                                  >
                                    <Shield className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                     </AnimatePresence>
                  </tbody>
                </table>
                  {filteredProducts.length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center italic">
                        <Package className="w-8 h-8 text-gray-100 opacity-20 mb-2" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">No matching records found in vault</p>
                    </div>
                  )}
              </div>
            </motion.div>
          )}
       </AnimatePresence>
      </div>
    </div>
  );
}
