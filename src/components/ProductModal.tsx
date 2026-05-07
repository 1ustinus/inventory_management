import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Barcode as BarcodeIcon, Printer, FileSpreadsheet, AlertCircle, Info, Image as ImageIcon, Box, Tag, DollarSign, Activity } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { localDb, STORAGE_KEYS } from '../lib/localDb';

const productSchema = z.object({
  name: z.string().min(2, 'Item name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a valid category'),
  agency: z.string().min(1, 'Agency/Source identification required'),
  accountCode: z.string().min(1, 'Accountancy code required'),
  stockNo: z.string().min(1, 'Stock number/SKU required'),
  reOrderPoint: z.number().min(0, 'Must be positive'),
  price: z.number().min(0, 'Price cannot be negative'),
  costPrice: z.number().min(0, 'Cost cannot be negative'),
  stockQuantity: z.number().min(0, 'Initial quantity required'),
  imageUrl: z.string().optional(),
  unit: z.string().min(1, 'Unit of measurement required'),
  description: z.string().optional()
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: any | null;
}

export default function ProductModal({ isOpen, onClose, editingProduct }: ProductModalProps) {
  const [activeTab, setActiveTab] = useState<'entry' | 'list'>('entry');
  const [generatedBarcode, setGeneratedBarcode] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unit: 'pcs',
      reOrderPoint: 10,
      stockQuantity: 0,
      price: 0,
      costPrice: 0,
      description: '',
      agency: 'General Supply'
    }
  });

  const itemName = watch('name');

  // Handle editingProduct changes
  React.useEffect(() => {
    if (editingProduct) {
      reset({
        name: editingProduct.name || '',
        category: editingProduct.category || '',
        agency: editingProduct.agency || 'General Supply',
        accountCode: editingProduct.accountCode || '',
        stockNo: editingProduct.stockNo || editingProduct.sku || '',
        reOrderPoint: editingProduct.minStockLevel || editingProduct.reOrderPoint || 10,
        price: editingProduct.price || 0,
        costPrice: editingProduct.costPrice || 0,
        stockQuantity: editingProduct.stockQuantity || 0,
        imageUrl: editingProduct.imageUrl || '',
        unit: editingProduct.unit || 'pcs',
        description: editingProduct.description || '',
      });
      setGeneratedBarcode(editingProduct.barcode || '');
    } else {
      reset({
        name: '',
        category: '',
        agency: 'General Supply',
        accountCode: '',
        stockNo: '',
        reOrderPoint: 10,
        price: 0,
        costPrice: 0,
        stockQuantity: 0,
        imageUrl: '',
        unit: 'pcs',
        description: '',
      });
      setGeneratedBarcode('');
    }
  }, [editingProduct, reset, isOpen]);

  const handleGenerateBarcode = () => {
    const code = Math.floor(Math.random() * 9000000000000 + 1000000000000).toString();
    setGeneratedBarcode(code);
    setValue('stockNo', `SN-${code.substring(0, 6)}`, { shouldValidate: true });
  };

  const handleGenerateImage = () => {
    const seed = encodeURIComponent((itemName || 'item').toLowerCase().replace(/\s+/g, '-'));
    setValue('imageUrl', `https://picsum.photos/seed/${seed}/400/400`, { shouldValidate: true });
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const barcodeValue = generatedBarcode || Math.floor(Math.random() * 1000000).toString();
      
      const payload = {
        ...data,
        barcode: barcodeValue,
        sku: data.stockNo || `SKU-${barcodeValue}`,
        minStockLevel: data.reOrderPoint,
      };

      if (editingProduct) {
        localDb.update<any>(STORAGE_KEYS.PRODUCTS, editingProduct.id, {
          ...payload,
          id: editingProduct.id,
          updatedAt: new Date().toISOString()
        });
      } else {
        localDb.add<any>(STORAGE_KEYS.PRODUCTS, {
          ...payload,
          id: Math.random().toString(36).substring(7),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      reset();
      setGeneratedBarcode('');
      onClose();
    } catch (error) {
      console.error('Record Commit Failure:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl win-outset shadow-2xl p-0.5 md:p-1 max-h-[98vh] flex flex-col"
          >
            {/* Window Header */}
            <div className="win-header mb-1 shrink-0 px-2 py-1 flex items-center justify-between bg-gradient-to-r from-blue-900 to-blue-700">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Box className="w-3.5 h-3.5 text-white" />
                <div className="flex flex-col">
                   <h2 className="text-[10px] md:text-xs font-black text-white uppercase tracking-tight">
                     {editingProduct ? 'OPERATIVE_MODIFICATION_PROTOCOL' : 'IDENTITY_ALLOCATION_TERMINAL'}
                   </h2>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={onClose} className="win-button p-0 h-5 w-5 flex items-center justify-center text-[12px] font-black hover:bg-red-600 hover:text-white transition-colors">×</button>
              </div>
            </div>

            <div className="bg-[var(--color-win-bg)] p-1 overflow-y-auto flex-1 custom-scrollbar">
               <div className="win-outset p-2 md:p-6 bg-[var(--color-win-bg)] min-h-[500px]">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Top Control Bar */}
                    <div className="flex flex-col md:flex-row gap-4 items-start pb-4 border-b border-gray-300">
                       <div className="win-inset bg-white p-1 shrink-0 w-32 h-32 flex items-center justify-center relative group">
                          {watch('imageUrl') ? (
                            <img src={watch('imageUrl')} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                               <ImageIcon className="w-8 h-8 opacity-20" />
                               <span className="text-[8px] font-bold uppercase tracking-tighter">No_Visual_ID</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/40 transition-all flex items-center justify-center flex-col opacity-0 group-hover:opacity-100 p-2 text-center pointer-events-none md:pointer-events-auto">
                             <button 
                              type="button" 
                              onClick={handleGenerateImage}
                              className="win-button text-[8px] p-1 w-full flex items-center justify-center gap-1 bg-white hover:italic"
                             >
                               <Save className="w-2.5 h-2.5" /> REGEN_IMG
                             </button>
                          </div>
                       </div>
                       
                       <div className="flex-1 space-y-3 w-full">
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Global Identity Name</label>
                                {errors.name && <AlertCircle className="w-3 h-3 text-red-600 animate-pulse" />}
                             </div>
                             <input 
                                {...register('name')} 
                                autoFocus 
                                placeholder="Enter designation (e.g. Purefoods Corned Beef 150g)"
                                className={`win-input w-full h-9 px-3 text-sm font-black italic tracking-tight ${errors.name ? 'border-red-600 bg-red-50' : 'bg-white'}`} 
                             />
                             {errors.name && <span className="text-[9px] text-red-600 font-bold uppercase italic">{errors.name.message}</span>}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                   <label className="text-[9px] font-black text-gray-600 uppercase">Category Tag</label>
                                   {errors.category && <AlertCircle className="w-2.5 h-2.5 text-red-600" />}
                                </div>
                                <select 
                                   {...register('category')} 
                                   className={`win-input w-full h-8 py-0 px-2 text-[11px] font-bold ${errors.category ? 'border-red-600 bg-red-50' : 'bg-white'}`}
                                >
                                  <option value="">Select Department...</option>
                                  {CATEGORIES.map(cat => (
                                    <option key={cat.code} value={cat.name}>{cat.name}</option>
                                  ))}
                                </select>
                                {errors.category && <span className="text-[8px] text-red-600 font-bold uppercase">{errors.category.message}</span>}
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-600 uppercase">Agency Source</label>
                                <input {...register('agency')} className={`win-input w-full h-8 px-2 text-[11px] font-bold ${errors.agency ? 'border-red-600' : 'bg-white'}`} />
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Technical Specs Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {/* Left: Identifiers */}
                       <div className="space-y-4">
                          <div className="win-header !bg-gray-700 py-1 px-2 mb-2 flex items-center gap-1">
                             <Tag className="w-3 h-3" />
                             <span className="text-[9px] font-black text-white uppercase tracking-widest">Identification_Data</span>
                          </div>
                          
                          <div className="space-y-3 px-1">
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase">Account Code</label>
                                <input {...register('accountCode')} className={`win-input w-full h-7 px-2 text-[11px] font-mono ${errors.accountCode ? 'border-red-600' : 'bg-white'}`} />
                                {errors.accountCode && <p className="text-[8px] text-red-600 font-bold italic">{errors.accountCode.message}</p>}
                             </div>
                             
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase">Tracking Serial (SKU)</label>
                                <div className="flex gap-1">
                                  <input {...register('stockNo')} className={`win-input flex-1 h-7 px-2 text-[11px] font-mono ${errors.stockNo ? 'border-red-600' : 'bg-white'}`} />
                                  <button 
                                    type="button" 
                                    onClick={handleGenerateBarcode}
                                    className="win-button p-1 hover:animate-pulse"
                                    title="Auto-Assign SKU"
                                  >
                                    <BarcodeIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {errors.stockNo && <p className="text-[8px] text-red-600 font-bold italic">{errors.stockNo.message}</p>}
                             </div>

                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase">Barcode Reference</label>
                                <input 
                                  value={generatedBarcode} 
                                  readOnly 
                                  className="win-input w-full h-7 bg-gray-100 text-[11px] font-mono px-2 italic text-gray-600 border-dashed" 
                                  placeholder="AUTO-GEN ON COMMIT"
                                />
                             </div>
                          </div>
                       </div>

                       {/* Center: Inventory Control */}
                       <div className="space-y-4">
                          <div className="win-header !bg-blue-800 py-1 px-2 mb-2 flex items-center gap-1">
                             <Activity className="w-3 h-3" />
                             <span className="text-[9px] font-black text-white uppercase tracking-widest">Inventory_Thresholds</span>
                          </div>

                          <div className="space-y-3 px-1">
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black text-gray-500 uppercase">Base Unit</label>
                                   <input {...register('unit')} className={`win-input w-full h-7 px-2 text-[11px] font-bold ${errors.unit ? 'border-red-600' : 'bg-white'}`} />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black text-gray-500 uppercase">Safety Stock</label>
                                   <input type="number" {...register('reOrderPoint', { valueAsNumber: true })} className="win-input w-full h-7 px-2 text-[11px] font-bold bg-white" />
                                </div>
                             </div>

                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase">Initial Inventory Balance</label>
                                <div className="relative">
                                   <input type="number" {...register('stockQuantity', { valueAsNumber: true })} className={`win-input w-full h-10 px-3 text-lg font-black bg-blue-50 text-blue-900 ${errors.stockQuantity ? 'border-red-600' : ''}`} />
                                   <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                      <span className="text-[8px] font-black text-blue-300 uppercase tracking-widest leading-none">Units_In_Vault</span>
                                   </div>
                                </div>
                                {errors.stockQuantity && <p className="text-[8px] text-red-600 font-bold italic">{errors.stockQuantity.message}</p>}
                             </div>

                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase">Operational Memo</label>
                                <textarea {...register('description')} className="win-input w-full h-12 p-2 text-[10px] bg-white resize-none" placeholder="Administrative notes..." />
                             </div>
                          </div>
                       </div>

                       {/* Right: Fiscal Data */}
                       <div className="space-y-4">
                          <div className="win-header !bg-emerald-800 py-1 px-2 mb-2 flex items-center gap-1">
                             <DollarSign className="w-3 h-3" />
                             <span className="text-[9px] font-black text-white uppercase tracking-widest">Financial_Valuation</span>
                          </div>

                          <div className="space-y-4 px-1">
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase">Procurement Cost (P)</label>
                                <div className="relative">
                                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-[11px]">₱</span>
                                   <input type="number" step="0.01" {...register('costPrice', { valueAsNumber: true })} className={`win-input w-full h-8 pl-8 pr-2 text-sm font-black bg-gray-50 ${errors.costPrice ? 'border-red-600' : ''}`} />
                                </div>
                             </div>

                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase">Standard Liquidation Price (SRP)</label>
                                <div className="relative">
                                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 font-black text-[11px]">₱</span>
                                   <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} className={`win-input w-full h-10 pl-8 pr-2 text-lg font-black bg-white border-2 ${errors.price ? 'border-red-600' : 'border-blue-200'}`} />
                                </div>
                             </div>

                             <div className="p-3 win-inset bg-blue-50/50 space-y-2 border border-blue-100 shadow-inner">
                                <div className="flex justify-between items-center text-[10px]">
                                   <span className="text-gray-500 font-bold uppercase tracking-tighter italic">Net Potential Margin</span>
                                   <span className="font-black text-emerald-700 underline decoration-emerald-700/30 underline-offset-2">
                                      ₱{((watch('price') || 0) - (watch('costPrice') || 0)).toLocaleString()}
                                   </span>
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden win-inset">
                                   <div 
                                      className="h-full bg-emerald-500 transition-all duration-700" 
                                      style={{ width: `${Math.min(100, Math.max(0, (((watch('price') || 0) - (watch('costPrice') || 0)) / (watch('price') || 1)) * 100))}%` }} 
                                   />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Management Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-300">
                       <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-700 opacity-50" />
                          <p className="text-[9px] font-bold text-gray-500 uppercase italic tracking-tighter">
                            Record updates must be verified against physical logs upon successful database commitment.
                          </p>
                       </div>
                       
                       <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={onClose}
                            className="win-button px-6 py-2 text-[10px] font-black uppercase text-gray-600"
                          >
                            Close_Terminal
                          </button>
                          <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="win-button px-10 py-2 text-[10px] font-black uppercase bg-white text-blue-900 border-blue-900 shadow-[2px_2px_0] shadow-blue-900/20 active:translate-y-[1px] disabled:opacity-50"
                          >
                            {isSubmitting ? 'PROCESSING...' : (editingProduct ? 'COMMIT_RECORD_FIX' : 'ALLOCATE_ITEM_IDENTITY')}
                          </button>
                       </div>
                    </div>
                  </form>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

