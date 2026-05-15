import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Calendar, 
  Download, 
  FileText, 
  FileJson, 
  Table as TableIcon,
  ChevronDown,
  Filter,
  ShoppingCart, 
  TrendingUp,
  Shield,
  Terminal
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { CATEGORIES } from '../constants';
import { hasPermission } from '../lib/permissions';
import { User, Sale } from '../types';
import * as XLSX from 'xlsx';
import { localDb, STORAGE_KEYS } from '../lib/localDb';
import { format } from 'date-fns';

const salesData = [
  { day: 'Mon', revenue: 45000, profit: 12000 },
  { day: 'Tue', revenue: 38000, profit: 10000 },
  { day: 'Wed', revenue: 52000, profit: 15000 },
  { day: 'Thu', revenue: 48000, profit: 13000 },
  { day: 'Fri', revenue: 61000, profit: 18000 },
  { day: 'Sat', revenue: 75000, profit: 22000 },
  { day: 'Sun', revenue: 68000, profit: 20000 },
];

const categoryData = [
  { name: 'Basic Needs', value: 35, color: '#3b82f6' },
  { name: 'Beverages', value: 25, color: '#10b981' },
  { name: 'Snacks', value: 15, color: '#f59e0b' },
  { name: 'Canned Goods', value: 10, color: '#ef4444' },
  { name: 'Others', value: 15, color: '#8b5cf6' },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState('This Week');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const authData = localStorage.getItem('flexi-auth');
    if (authData) setCurrentUser(JSON.parse(authData));
  }, []);

  const canView = hasPermission(currentUser, 'reports:view');
  const canExport = hasPermission(currentUser, 'reports:export');

  const exportToExcel = (customSales?: Sale[]) => {
    const salesToProcess = customSales || localDb.getAll<Sale>(STORAGE_KEYS.SALES);
    const dataToExport = salesToProcess.map(sale => ({
      'Transaction ID': sale.transactionId || sale.id.substring(0, 8),
      'Date': format(new Date(sale.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      'Items Count': sale.items.length,
      'Payment Method': sale.paymentMethod.toUpperCase(),
      'Total Amount': sale.total,
      'Status': sale.status.toUpperCase(),
      'Customer': sale.customerName || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, `FlexiMart_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

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
                  Identity signature [{(currentUser?.displayName || 'UNKNOWN').toUpperCase()}] lacks required analytical clearances (reports:view).
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

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8 max-w-[1600px] mx-auto bg-[var(--color-win-bg)] min-h-screen">
      <header className="win-outset p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-[var(--color-win-bg)]">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-[var(--color-win-text)] tracking-tight uppercase italic underline decoration-2">Intelligence Dashboard / Analytical Nodes</h1>
          <p className="text-gray-700 font-bold italic text-[10px] md:text-sm">Deep-dive binary analytics and strategic financial projections.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setDateRange(prev => prev === 'This Week' ? 'This Month' : 'This Week')}
             className="win-button px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
           >
             <Calendar className="w-3.5 h-3.5 text-[var(--color-win-blue)]" />
             {dateRange}
           </button>
           <button 
             onClick={() => exportToExcel()}
             disabled={!canExport}
             className={cn(
               "win-button px-5 py-2 bg-white text-[var(--color-win-blue)] font-black uppercase tracking-widest flex items-center gap-2 underline",
               !canExport && "opacity-50 cursor-not-allowed grayscale"
             )}
           >
             <Download className="w-3.5 h-3.5" /> Dump Report
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Profit Chart */}
        <div className="win-outset p-1 bg-[var(--color-win-bg)] flex flex-col h-[450px]">
          <div className="win-header px-2 py-0.5 mb-1 text-[10px] font-bold">
            <span>REVENUE_GROWTH_PROJECTIONS</span>
          </div>
          <div className="flex-1 bg-white win-inset p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#404040', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#404040', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,128,0.05)'}}
                  contentStyle={{backgroundColor: '#DFDFDF', border: '2px solid #808080', boxShadow: '4px 4px 0 rgba(0,0,0,0.1)'}}
                  itemStyle={{fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'}}
                />
                <Bar dataKey="revenue" fill="#000080" radius={[0,0,0,0]} barSize={20} />
                <Bar dataKey="profit" fill="#10b981" radius={[0,0,0,0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Pie */}
        <div className="win-outset p-1 bg-[var(--color-win-bg)] flex flex-col h-[450px]">
           <div className="win-header px-2 py-0.5 mb-1 text-[10px] font-bold">
             <span>SEGMENT_DISTRIBUTION_CHART</span>
           </div>
           <div className="flex-1 flex flex-col md:flex-row items-center gap-4 bg-white win-inset p-4 overflow-hidden">
             <div className="flex-1 h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#FFFFFF"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{backgroundColor: '#DFDFDF', border: '2px solid #808080'}}
                      itemStyle={{fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="p-4 win-outset bg-[var(--color-win-bg)] w-full md:w-56 space-y-2">
                {categoryData.map(item => (
                  <div key={item.name} className="flex items-center justify-between group border-b border-white/20 pb-1">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 win-outset" style={{backgroundColor: item.color}} />
                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-tighter group-hover:text-black transition-colors italic">{item.name}</span>
                     </div>
                     <span className="text-[10px] font-black text-[var(--color-win-blue)]">{item.value}%</span>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="win-outset p-6 bg-[var(--color-win-bg)] space-y-4 group">
           <div className="p-2 win-inset bg-white text-[var(--color-win-blue)] w-fit">
              <TrendingUp className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Fiscal Net Yield</p>
              <h4 className="text-2xl font-black text-[var(--color-win-text)] tracking-tighter italic underline decoration-blue-700/30">{formatCurrency(145820)}</h4>
              <p className="text-[9px] text-emerald-700 font-black uppercase mt-2 flex items-center gap-1">
                 <TrendingUp className="w-3 h-3" /> +15.2% VELOCITY
              </p>
           </div>
        </div>

        <div className="win-outset p-6 bg-[var(--color-win-bg)] space-y-4 group">
           <div className="p-2 win-inset bg-white text-[var(--color-win-blue)] w-fit">
              <ShoppingCart className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Avg Transaction Index</p>
              <h4 className="text-2xl font-black text-[var(--color-win-text)] tracking-tighter italic underline decoration-blue-700/30">{formatCurrency(485)}</h4>
              <p className="text-[9px] text-blue-700 font-black uppercase mt-2 flex items-center gap-1">
                 <TrendingUp className="w-3 h-3" /> +3.5% STABILITY
              </p>
           </div>
        </div>

        <div className="win-outset p-1 bg-[var(--color-win-bg)] flex flex-col min-h-[160px]">
           <div className="win-header px-2 py-0.5 mb-1 text-[10px] font-bold">
             <span>SECURE_VALT_EXPORT</span>
           </div>
           <div className="flex-1 p-3 flex flex-col justify-between bg-white win-inset">
              <p className="text-[9px] text-gray-600 leading-relaxed uppercase font-black italic">Raw data transmission for external auditing protocols.</p>
              <div className="grid grid-cols-3 gap-1 mt-2">
                 {[
                   { label: 'CSV', icon: FileText },
                   { label: 'DB', icon: FileJson },
                   { label: 'XLS', icon: TableIcon }
                 ].map(format => (
                   <button 
                     key={format.label}
                     disabled={!canExport}
                     className={cn(
                       "win-button py-2 flex flex-col items-center gap-1 hover:text-[var(--color-win-blue)]",
                       !canExport && "opacity-50 cursor-not-allowed grayscale"
                     )}
                   >
                     <format.icon className="w-3.5 h-3.5" />
                     <span className="text-[8px] font-black uppercase">{format.label}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
