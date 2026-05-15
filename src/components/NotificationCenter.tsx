import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, Package, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { STORAGE_KEYS } from '../lib/localDb';
import { firestoreDb } from '../lib/firestore';
import { Notification } from '../types';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to notifications for real-time alerts
    const unsubscribe = firestoreDb.subscribe<Notification>(STORAGE_KEYS.NOTIFICATIONS, (data) => {
      const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(sorted);
      setUnreadCount(sorted.filter(n => !n.isRead).length);
    });
    
    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await firestoreDb.update<Notification>(STORAGE_KEYS.NOTIFICATIONS, id, { isRead: true });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'out_of_stock': return <X className="w-3.5 h-3.5 text-rose-500" />;
      case 'damaged': return <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />;
      case 'expiry': return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
      case 'sale': return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <Info className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative win-button p-1.5"
      >
        <Bell className="w-4 h-4 text-[var(--color-win-blue)]" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 border-2 border-[var(--color-win-bg)] shadow-md" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[140]" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 win-outset shadow-2xl z-[150] overflow-hidden p-1"
            >
              <div className="win-header flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest">Global Feed</h3>
                <span className="text-[8px] font-black text-emerald-500 bg-white/20 px-2 py-0.5 win-inset uppercase tracking-widest">{unreadCount} Pending</span>
              </div>

              <div className="bg-[var(--color-win-bg)] max-h-[400px] overflow-y-auto divide-y divide-[var(--color-win-dark)] custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center opacity-30 italic">
                    <Package className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Signal clear.</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-blue-50 transition-all flex gap-3 group relative italic font-bold",
                        !notification.isRead && "bg-white/40"
                      )}
                    >
                      {!notification.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-win-blue)]" />
                      )}
                      <div className="mt-1 p-1 win-inset bg-white shrink-0 h-fit">{getTypeIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-[var(--color-win-text)] uppercase tracking-tight">{notification.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed opacity-80">{notification.message}</p>
                        <p className="text-[8px] text-[var(--color-win-blue)] mt-2 font-black uppercase tracking-widest italic opacity-60">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-[var(--color-win-dark)] text-center bg-[var(--color-win-bg)]">
                <button className="text-[9px] font-black text-gray-500 hover:text-[var(--color-win-blue)] uppercase tracking-widest transition-colors font-bold italic">
                  Archived Communication
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
