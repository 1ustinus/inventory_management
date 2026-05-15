import React, { useState, useEffect } from 'react';
import { cn, formatCurrency } from '../lib/utils';
import { format, startOfDay } from 'date-fns';
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertCircle,
  ArrowRight,
  PhilippinePeso,
  X,
  Package
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { localDb, STORAGE_KEYS } from '../lib/localDb';
import { Sale, Product } from '../types';
import { Link } from 'react-router-dom';

const data = [
  { name: '06:00', sales: 4000 },
  { name: '08:00', sales: 3000 },
  { name: '10:00', sales: 2000 },
  { name: '12:00', sales: 2780 },
  { name: '14:00', sales: 1890 },
  { name: '16:00', sales: 2390 },
  { name: '18:00', sales: 3490 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    transactions: 0,
    lowStock: 0,
    avgBasket: 0
  });

  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [isAlertDismissed, setIsAlertDismissed] = useState(() => {
    return sessionStorage.getItem('low_stock_alert_dismissed') === 'true';
  });

  const dismissAlert = () => {
    setIsAlertDismissed(true);
    sessionStorage.setItem('low_stock_alert_dismissed', 'true');
  };

  useEffect(() => {
    const updateStats = () => {
      const sales = localDb.getAll<Sale>(STORAGE_KEYS.SALES);
      const products = localDb.getAll<Product>(STORAGE_KEYS.PRODUCTS);

      const today = startOfDay(new Date());
      const todaySales = sales.filter(s => new Date(s.createdAt) >= today);
      
      const total = todaySales.reduce((acc, s) => acc + s.total, 0);
      setStats({
        totalSales: total,
        transactions: todaySales.length,
        avgBasket: todaySales.length > 0 ? total / todaySales.length : 0,
        lowStock: products.filter(p => p.stockQuantity <= (p.minStockLevel || 10)).length
      });
      
      setRecentSales(sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
    };

    updateStats();
    window.addEventListener('storage_update', updateStats);
    return () => window.removeEventListener('storage_update', updateStats);
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8 max-w-[1600px] mx-auto bg-[var(--color-win-bg)] min-h-screen">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-[var(--color-win-text)] tracking-tight">FlexiMart Dashboard</h1>
          <p className="text-gray-700 font-medium italic text-[10px] md:text-sm">Welcome back, operative. Overview of today's activities.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="win-button flex-1 md:flex-none px-4 py-2 text-xs font-bold transition-all uppercase tracking-widest text-[9px] md:text-xs">
            Export Report
          </button>
          <button className="win-button flex-1 md:flex-none px-4 py-2 bg-emerald-500 text-white font-black hover:bg-emerald-400 transition-all shadow-lg uppercase tracking-widest text-[9px] md:text-xs">
            New Entry
          </button>
        </div>
      </header>

      {/* Low Stock Alert */}
      <AnimatePresence>
        {!isAlertDismissed && stats.lowStock > 5 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="win-outset bg-amber-50 border-amber-200 p-4 flex items-center justify-between gap-4 shadow-lg mb-6 border-l-4 border-l-amber-500">
               <div className="flex items-center gap-4">
                  <div className="win-inset bg-amber-100 p-2">
                     <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                     <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest leading-none mb-1">Critical Stock Warning</h4>
                     <p className="text-[11px] font-bold text-amber-700 italic">
                        The system has detected <span className="underline decoration-amber-500 decoration-2">{stats.lowStock} units</span> with depletion status above the safety threshold.
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <Link 
                    to="/inventory"
                    className="win-button bg-amber-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500 transition-colors"
                  >
                     Review Inventory <ArrowRight className="w-3 h-3" />
                  </Link>
                  <button 
                    onClick={dismissAlert}
                    className="win-button p-2 text-amber-900/50 hover:text-amber-900"
                    title="Dismiss protocol"
                  >
                     <X className="w-4 h-4" />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Today's Revenue", value: formatCurrency(stats.totalSales), icon: PhilippinePeso, color: 'emerald', trend: '+12.4% from yesterday' },
          { label: 'Transactions', value: stats.transactions, icon: ShoppingCart, color: 'blue', trend: `Avg ticket: ${formatCurrency(stats.avgBasket)}` },
          { label: 'Stock Alerts', value: stats.lowStock, icon: AlertCircle, color: 'rose', trend: 'Items below critical level' },
          { label: 'Growth', value: '8.4%', icon: TrendingUp, color: 'emerald', trend: 'Monthly performance' },
        ].map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stat.label}
            className="win-outset p-6 group hover:border-emerald-500/30 transition-all cursor-default"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-xl bg-opacity-10 transition-transform duration-300 group-hover:scale-110 ${
                stat.color === 'emerald' ? 'bg-emerald-500 text-emerald-500' : 
                stat.color === 'blue' ? 'bg-blue-500 text-blue-500' : 
                stat.color === 'rose' ? 'bg-rose-500 text-rose-500' : 'bg-gray-500 text-gray-500'
              }`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-widest">{stat.label}</p>
            <p className={cn(
              "text-2xl font-bold tracking-tight mb-1",
              stat.color === 'rose' && stats.lowStock > 0 ? "text-rose-500" : "text-[var(--color-win-text)]"
            )}>{stat.value}</p>
            <p className={`text-[10px] font-medium ${
              stat.color === 'rose' ? 'text-rose-400/70' : 
              stat.color === 'emerald' ? 'text-emerald-500/70' : 'text-blue-400/70'
            }`}>{stat.trend}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 win-outset p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-semibold text-[var(--color-win-text)]">Revenue Performance</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-gray-400 font-bold uppercase transition">24H</button>
              <button className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] text-gray-400 font-bold uppercase transition">7D</button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-win-dark)" opacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-win-text)', fontSize: 10, fontWeight: 600, opacity: 0.6 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-win-text)', fontSize: 10, fontWeight: 600, opacity: 0.6 }}
                  tickFormatter={(val) => `₱${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-win-surface)', borderRadius: '4px', border: '2px solid var(--color-win-dark)', boxShadow: '4px 4px 0 rgba(0,0,0,0.2)' }}
                  itemStyle={{ fontSize: '12px', color: '#10b981' }}
                  labelStyle={{ color: 'var(--color-win-text)', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}
                  formatter={(value: any) => [formatCurrency(value), 'Sales']}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="win-outset p-8 flex flex-col">
          <h3 className="text-sm font-semibold text-[var(--color-win-text)] mb-6 uppercase tracking-wider">Top Performers</h3>
          <div className="flex-1 space-y-6">
            {[
              { name: 'Red Horse Beer 1L', sold: 45, color: '#f59e0b' },
              { name: 'Nissin Cup Noodles', sold: 38, color: '#ef4444' },
              { name: 'Purefoods Corned Beef', sold: 32, color: '#3b82f6' },
              { name: 'Piattos Cheese', sold: 28, color: '#d946ef' },
              { name: 'Gardenia Loaf Bread', sold: 24, color: '#10b981' },
            ].map((item, idx) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
                  <span className="text-[var(--color-win-text)] opacity-80">{item.name}</span>
                  <span className="text-gray-700">{item.sold} sold</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.sold / 50) * 100}%` }}
                    transition={{ delay: 0.5 + idx * 0.1, duration: 1 }}
                    className="h-full rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 group w-full py-3 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2">
            Inventory Analytics <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="win-outset overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[var(--color-win-dark)] flex justify-between items-center bg-[var(--color-win-bg)]">
            <h2 className="text-sm font-semibold text-[var(--color-win-text)]">Recent Transactions</h2>
            <button className="text-[10px] font-bold text-gray-700 uppercase tracking-widest hover:text-[var(--color-win-blue)] transition-colors">View All</button>
          </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-[#E0E0E0] text-gray-700 text-[10px] uppercase tracking-wider font-bold border-b border-[var(--color-win-dark)]">
              <tr>
                <th className="px-8 py-3">ID REF</th>
                <th className="px-8 py-3">Timestamp</th>
                <th className="px-8 py-3 italic">Payment</th>
                <th className="px-8 py-3 italic">Basket</th>
                <th className="px-8 py-3 text-right italic">Settled</th>
                <th className="px-8 py-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="italic text-[10px] text-blue-900 font-black decoration-blue-700/50 underline-offset-4">OPS</span>
                    <span className="text-[7px] text-gray-500 font-bold uppercase tracking-tighter opacity-50">QUICK_VIEW</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-win-dark)] bg-white italic">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-blue-50 transition-colors group cursor-pointer">
                  <td className="px-8 py-4 font-mono text-[11px] text-gray-600 group-hover:text-emerald-500 transition-colors uppercase">{sale.transactionId || sale.id.substring(0, 8)}</td>
                  <td className="px-8 py-4 text-gray-800 font-medium text-xs">{format(new Date(sale.createdAt), 'hh:mm:ss a')}</td>
                  <td className="px-8 py-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase border border-emerald-500/20 shadow-sm">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-gray-600 font-medium text-xs">{sale.items.length} units</td>
                  <td className="px-8 py-4 text-right font-bold text-[var(--color-win-text)]">{formatCurrency(sale.total)}</td>
                  <td className="px-8 py-4 text-right">
                    <button 
                      className="win-button p-1 text-[var(--color-win-blue)] hover:bg-blue-50"
                      title="Open Record"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {recentSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-gray-400 font-medium italic text-xs">
                    Standing by for today's first transaction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
