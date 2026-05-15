import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  SearchX,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { STORAGE_KEYS } from '../lib/localDb';
import { firestoreDb } from '../lib/firestore';
import { Sale, User } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import Receipt from '../components/Receipt';
import { hasPermission } from '../lib/permissions';
import { Shield } from 'lucide-react';

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const authData = localStorage.getItem('flexi-auth');
    if (authData) setCurrentUser(JSON.parse(authData));

    // Subscribe to sales for real-time history
    const unsubscribe = firestoreDb.subscribe<Sale>(STORAGE_KEYS.SALES, (data) => {
      setSales(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
    
    return () => unsubscribe();
  }, []);

  const canView = hasPermission(currentUser, 'sales:view');
  const canVoid = hasPermission(currentUser, 'sales:void');

  if (!canView && currentUser) {
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
                 Identity signature [{(currentUser?.displayName || 'UNKNOWN').toUpperCase()}] lacks required analytical clearances (sales:view).
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

  const filteredSales = sales.filter(s => 
    s.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paymentIcons = {
    cash: Banknote,
    gcash: Smartphone,
    maya: Smartphone,
    card: CreditCard
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8 max-w-[1600px] mx-auto bg-[var(--color-win-bg)] min-h-screen">
      <header className="win-outset p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-[var(--color-win-bg)]">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-[var(--color-win-text)] tracking-tight uppercase italic underline decoration-2">Audit Ledger / Settlement Records</h1>
          <p className="text-gray-700 font-bold italic text-[10px] md:text-sm">Historical archive of all verified fiscal exchanges.</p>
        </div>
        <div className="flex gap-2">
          <button className="win-button px-5 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Ledger
          </button>
        </div>
      </header>

      <div className="win-outset p-1 bg-[var(--color-win-bg)] flex flex-col shadow-xl">
        <div className="win-header mb-1">
           <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">TRANSACTION_ARCHIVE_VIEWER</span>
           </div>
        </div>

        <div className="p-3 border-b border-[var(--color-win-dark)] flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--color-win-bg)]">
          <div className="relative flex-1 max-w-md">
            <input 
              type="text"
              placeholder="Query by Transaction UUID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="win-input w-full pl-10 h-9 text-[11px] font-bold"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <div className="flex gap-2">
             <button className="win-button px-4 h-9 flex items-center gap-2 text-[10px] font-black uppercase tracking-tight">
                <Calendar className="w-3.5 h-3.5 opacity-70" /> All Eras
             </button>
             <button className="win-button px-4 h-9 flex items-center gap-2 text-[10px] font-black uppercase tracking-tight">
                <Filter className="w-3.5 h-3.5 opacity-70" /> Filter
             </button>
          </div>
        </div>

        <div className="overflow-x-auto win-inset bg-white custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-[#E0E0E0] text-gray-700 text-[10px] font-black uppercase tracking-widest border-b border-[var(--color-win-dark)]">
                <th className="px-8 py-3 italic">Ref. Hash</th>
                <th className="px-8 py-3 italic">Timestamp</th>
                <th className="px-8 py-3 italic">Channel</th>
                <th className="px-8 py-3 text-center italic">Qty</th>
                <th className="px-8 py-3 italic">Net Total</th>
                <th className="px-8 py-3 italic">Status</th>
                <th className="px-8 py-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="italic text-[10px] text-blue-900 font-black decoration-blue-700/50 underline-offset-4">OPS</span>
                    <span className="text-[7px] text-gray-500 font-bold uppercase tracking-tighter opacity-50">RECORD_AUDIT</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 italic">
               {filteredSales.map((sale) => {
                 const MethodIcon = paymentIcons[sale.paymentMethod] || CreditCard;
                 return (
                   <tr key={sale.id} className="hover:bg-blue-50 transition-all group">
                     <td className="px-8 py-3 border-r border-gray-100">
                       <span className="font-mono font-bold text-gray-600 text-[10px] uppercase tracking-tighter opacity-90">{sale.transactionId}</span>
                     </td>
                     <td className="px-8 py-3 border-r border-gray-100">
                        <p className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">{format(new Date(sale.createdAt), 'MMM d, yyyy')}</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{format(new Date(sale.createdAt), 'hh:mm a')}</p>
                     </td>
                     <td className="px-8 py-3 border-r border-gray-100">
                        <div className="flex items-center gap-2">
                           <div className="p-1 win-inset bg-white group-hover:text-[var(--color-win-blue)] transition-colors">
                              <MethodIcon className="w-3 h-3" />
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">{sale.paymentMethod}</span>
                        </div>
                     </td>
                     <td className="px-8 py-3 text-center border-r border-gray-100">
                        <span className="text-[10px] font-black text-gray-700 bg-gray-50 px-2 py-0.5 win-outset">
                          {sale.items.length}
                        </span>
                     </td>
                     <td className="px-8 py-3 border-r border-gray-100">
                        <span className="font-black text-[var(--color-win-blue)] text-sm tracking-tight italic">₱{sale.total.toLocaleString()}</span>
                     </td>
                     <td className="px-8 py-3 border-r border-gray-100">
                        {sale.status === 'completed' ? (
                          <div className="flex items-center gap-1 text-emerald-700 text-[8px] font-black uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 border border-emerald-700/30 w-fit">
                             SETTLED
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-700 text-[8px] font-black uppercase tracking-widest bg-red-50 px-1.5 py-0.5 border border-red-700/30 w-fit">
                             VOID
                          </div>
                        )}
                     </td>
                     <td className="px-8 py-3 text-right">
                        <button 
                          onClick={() => setSelectedSale(sale)}
                          className="win-button p-1 text-[var(--color-win-blue)] hover:bg-blue-50"
                          title="Examine Manifest"
                        >
                           <FileText className="w-4 h-4" />
                        </button>
                     </td>
                   </tr>
                 );
               })}
            </tbody>
          </table>
          {filteredSales.length === 0 && (
             <div className="py-24 text-center flex flex-col items-center opacity-40">
                <History className="w-12 h-12 text-gray-800 mb-4" />
                <p className="text-gray-600 font-black text-[10px] uppercase tracking-widest italic">Archival records clear.</p>
             </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedSale(null)}
               className="absolute inset-0"
             />
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="relative bg-[var(--color-win-bg)] p-1 win-outset shadow-2xl max-w-sm w-full"
             >
                <div className="win-header mb-1">
                   <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      <h3 className="text-xs font-black uppercase tracking-widest">Transaction Snapshot</h3>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-none">Verified</span>
                   </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto mb-4 win-inset bg-white p-4 text-gray-800 custom-scrollbar">
                   <Receipt sale={selectedSale} />
                </div>
                <div className="flex gap-2 p-2 pt-0">
                   <button 
                    onClick={() => setSelectedSale(null)}
                    className="win-button flex-1 py-1.5 font-black text-[10px] uppercase tracking-widest transition-all"
                   >
                     Abort
                   </button>
                   <button 
                    onClick={() => { window.print(); setSelectedSale(null); }}
                    className="win-button flex-1 py-1.5 bg-white text-[var(--color-win-blue)] font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2 border-emerald-500/30"
                   >
                     <Printer className="w-3.5 h-3.5" /> Hard Copy
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
