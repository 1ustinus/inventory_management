import React, { useState, useEffect } from 'react';
import { 
  Menu,
  Search,
  Terminal,
  Calculator as CalcIcon, 
  User as UserIcon, 
  Shield, 
  Activity, 
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { User } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  user: User | null;
  onToggleCalc: () => void;
  onToggleMobileMenu?: () => void;
}

export default function Navbar({ user, onToggleCalc, onToggleMobileMenu }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="fixed top-0 right-0 left-0 md:left-60 h-12 bg-[var(--color-win-bg)] border-b-2 border-[var(--color-win-dark)] z-[100] flex items-center justify-between px-4 win-outset !border-t-0 !border-l-0 !border-r-0">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <button 
          onClick={onToggleMobileMenu}
          className="md:hidden win-button p-1.5"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 md:hidden">
          <Terminal className="w-4 h-4 text-[var(--color-win-blue)]" />
          <span className="text-[10px] font-black italic tracking-tighter">FlexiMart <span className="text-[var(--color-win-blue)] underline">98</span></span>
        </div>

        <div className="relative group hidden md:block">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search Commands..."
            className="win-input w-48 lg:w-64 h-7 pl-8 text-xs placeholder:italic"
          />
        </div>
        
        <div className="hidden lg:flex gap-2">
           <div className="px-2 py-0.5 win-inset text-[9px] uppercase font-bold text-[var(--color-win-blue)] bg-white/50">
             System: Operational
           </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
        <div className="text-right hidden md:block border-r border-[var(--color-win-dark)] pr-4">
          <div className="text-[10px] font-bold text-[var(--color-win-text)] uppercase">{format(currentTime, 'EEEE, MMM dd')}</div>
          <div className="text-[10px] text-[var(--color-win-blue)] font-mono font-bold tracking-tighter">{format(currentTime, 'HH:mm:ss')}</div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden win-button p-1"
          >
            <Search className="w-4 h-4" />
          </button>
          <button 
            onClick={onToggleCalc}
            className="win-button p-1"
            title="Calculator"
          >
            <CalcIcon className="w-4 h-4" />
          </button>
          
          <NotificationCenter />

          <div 
            className="relative ml-2"
            onMouseEnter={() => setShowProfile(true)}
            onMouseLeave={() => setShowProfile(false)}
            onClick={() => setShowProfile(!showProfile)}
          >
            <button className="win-button flex items-center gap-2 pr-1">
              <div className="w-5 h-5 bg-[var(--color-win-blue)] text-white flex items-center justify-center text-[10px] font-bold">
                {user?.displayName.charAt(0)}
              </div>
              <span className="text-[10px] font-bold uppercase truncate max-w-[80px]">{user?.displayName.split(' ')[0]}</span>
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 top-full mt-1 w-64 win-outset shadow-2xl z-[200] p-1"
                >
                  <div className="win-header mb-1">
                    <span className="text-[10px]">User Profile: {user?.uid}</span>
                  </div>
                  <div className="p-4 bg-[var(--color-win-bg)] space-y-4">
                    <div className="flex items-center gap-4 border-b border-[var(--color-win-dark)] pb-4">
                      <div className="w-12 h-12 win-inset flex items-center justify-center bg-white">
                        <UserIcon className="w-8 h-8 text-[var(--color-win-blue)]" />
                      </div>
                      <div>
                        <p className="text-sm font-black italic">{user?.displayName}</p>
                        <p className="text-[10px] font-bold text-[var(--color-win-darker)] uppercase tracking-tighter">{user?.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                       <div className="p-2 win-inset bg-white/30 space-y-1">
                          <Shield className="w-3 h-3 text-[var(--color-win-blue)]" />
                          <p className="text-[8px] font-black uppercase text-gray-500">Security Level</p>
                          <p className="text-[10px] font-bold uppercase">{user?.role || 'Guest'}</p>
                       </div>
                       <div className="p-2 win-inset bg-white/30 space-y-1">
                          <Activity className="w-3 h-3 text-emerald-600" />
                          <p className="text-[8px] font-black uppercase text-gray-500">Node Status</p>
                          <p className="text-[10px] font-bold uppercase text-emerald-700">Active</p>
                       </div>
                    </div>

                    <div className="bg-black/5 p-2 win-inset space-y-1">
                       <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-gray-600" />
                          <span className="text-[8px] font-black uppercase text-gray-500">Sync Frequency</span>
                       </div>
                       <div className="w-full bg-white h-1.5 win-inset overflow-hidden">
                          <div className="bg-[var(--color-win-blue)] h-full w-[85%]" />
                       </div>
                    </div>

                    <p className="text-[8px] text-center font-bold text-gray-500 italic uppercase">Logon: {user?.lastLogin ? format(new Date(user.lastLogin), 'MMM dd HH:mm') : 'N/A'}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
