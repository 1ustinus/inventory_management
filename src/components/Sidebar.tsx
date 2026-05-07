import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  History,
  Terminal,
  Database,
  Minus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../types';
import { motion } from 'motion/react';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export default function Sidebar({ 
  user, 
  onLogout, 
  isMinimized, 
  onToggleMinimize,
  isMobileMenuOpen,
  onCloseMobileMenu
}: SidebarProps) {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Control Center', path: '/', roles: ['admin', 'inventory', 'cashier'] },
    { icon: ShoppingCart, label: 'Sales Terminal', path: '/pos', roles: ['admin', 'cashier'] },
    { icon: Package, label: 'Warehouse DB', path: '/inventory', roles: ['admin', 'inventory'] },
    { icon: History, label: 'Log Journals', path: '/sales', roles: ['admin', 'cashier'] },
    { icon: Users, label: 'Auth Registry', path: '/users', roles: ['admin'] },
    { icon: BarChart3, label: 'Analytics', path: '/reports', roles: ['admin'] },
    { icon: Settings, label: 'SysConfig', path: '/settings', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-[var(--color-win-bg)] border-r-2 border-[var(--color-win-dark)] z-50 flex flex-col font-sans win-outset !border-t-0 !border-l-0 transition-all duration-300",
          isMinimized ? "w-16" : "w-60",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
      <div className="p-4 flex items-center justify-between border-b border-[var(--color-win-dark)] bg-white/20">
        <div className={cn("flex items-center gap-3 overflow-hidden transition-opacity", isMinimized ? "opacity-0 invisible w-0" : "opacity-100 visible w-auto")}>
          <div className="w-8 h-8 win-inset bg-[var(--color-win-blue)] flex items-center justify-center text-white shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="flex flex-col whitespace-nowrap">
             <h1 className="text-sm font-black italic tracking-tighter text-black">FlexiMart <span className="text-[var(--color-win-blue)] underline">98</span></h1>
             <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Enterprise Edition</span>
          </div>
        </div>
        <button 
          onClick={onToggleMinimize}
          className="win-button p-1 flex items-center justify-center min-w-[24px] h-6"
          title={isMinimized ? "Maximize" : "Minimize"}
        >
          {isMinimized ? <LayoutDashboard className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-4 overflow-y-auto custom-scrollbar">
        <div>
          <p className={cn("px-2 text-[9px] uppercase tracking-[0.2em] text-[var(--color-win-blue)] font-black mb-3 italic transition-opacity", isMinimized ? "opacity-0 h-0 overflow-hidden" : "opacity-100")}>Main Directories</p>
          <div className="space-y-0.5">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 transition-all text-[11px] font-bold relative group",
                    isActive 
                      ? "win-inset bg-white/50 text-[var(--color-win-blue)]" 
                      : "hover:bg-white/30 text-gray-800"
                  )}
                  title={isMinimized ? item.label : ""}
                  onClick={onCloseMobileMenu}
                >
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[var(--color-win-blue)]" : "text-gray-600")} />
                  {!isMinimized && <span className="flex-1 whitespace-nowrap">{item.label}</span>}
                  
                  {isMinimized && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
           <p className={cn("px-2 text-[9px] uppercase tracking-[0.2em] text-[var(--color-win-blue)] font-black mb-3 italic transition-opacity", isMinimized ? "opacity-0 h-0 overflow-hidden" : "opacity-100")}>System Utilities</p>
           <div className="space-y-0.5 opacity-60">
              <div className="flex items-center gap-2.5 px-3 py-1.5 text-[11px] font-bold text-gray-500 cursor-not-allowed group relative">
                 <Database className="w-4 h-4 shrink-0" />
                 {!isMinimized && <span>Backup Node</span>}
                 {isMinimized && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                      Backup Node (Disabled)
                    </div>
                 )}
              </div>
           </div>
        </div>
      </nav>

      <div className="p-2 border-t border-[var(--color-win-dark)] space-y-2">
        <div 
          className="group relative win-inset bg-white/40 p-2 flex items-center gap-3 cursor-help overflow-hidden"
        >
          <div className="w-8 h-8 win-inset bg-white flex items-center justify-center text-[var(--color-win-blue)] font-black text-xs shrink-0">
            {user.displayName.charAt(0)}
          </div>
          {!isMinimized && (
            <div className="flex-1 overflow-hidden transition-opacity">
              <div className="text-[10px] font-black text-black truncate italic">{user.displayName}</div>
              <div className="text-[8px] text-[var(--color-win-darker)] uppercase font-bold tracking-tighter">Level: {user.role}</div>
            </div>
          )}

          {/* Tooltip */}
          <div className="absolute bottom-full left-0 mb-2 w-56 win-outset bg-[var(--color-win-bg)] p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl">
            <div className="win-header px-1.5 py-0.5 mb-2 text-[9px] font-bold">PROFILE_INFO.LOG</div>
            <div className="space-y-2 text-[10px] font-bold">
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span className="text-gray-500 uppercase">Username:</span>
                <span className="text-black italic">{user.username || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span className="text-gray-500 uppercase">Email:</span>
                <span className="text-black truncate max-w-[100px]">{user.email}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span className="text-gray-500 uppercase">Role:</span>
                <span className="text-[var(--color-win-blue)] uppercase">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase">Last Login:</span>
                <span className="text-black">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
            <div className="mt-3 text-[8px] font-black text-gray-400 text-center uppercase tracking-widest">--- End of Record ---</div>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="win-button w-full py-1.5 text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 hover:text-red-700 overflow-hidden"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isMinimized && <span className="whitespace-nowrap transition-opacity">Shutdown Session</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
