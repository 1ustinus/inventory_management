import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Wallet, Smartphone, Banknote, CheckCircle2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { PAYMENT_METHODS } from '../constants';
import { PaymentMethod } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (method: PaymentMethod, amountReceived: number) => void;
}

export default function PaymentModal({ isOpen, onClose, total, onConfirm }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [received, setReceived] = useState(total.toString());
  const [isSuccess, setIsSuccess] = useState(false);

  // Update received whenever total changes if not manually edited
  React.useEffect(() => {
    setReceived(total.toString());
  }, [total]);

  const change = Math.max(0, parseFloat(received || '0') - total);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(received) < total) return;
    
    setIsSuccess(true);
    setTimeout(() => {
      onConfirm(method, parseFloat(received));
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  const paymentIcons = {
    cash: Banknote,
    gcash: Smartphone,
    maya: Wallet,
    card: CreditCard
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg win-outset shadow-2xl p-1 bg-[var(--color-win-bg)]"
          >
            <div className="win-header mb-1 px-2 py-1 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <h2 className="text-[11px] font-bold uppercase truncate">Settlement Terminal</h2>
              </div>
              <button onClick={onClose} className="win-button p-0.5 h-5 w-5 flex items-center justify-center text-[10px]">X</button>
            </div>

            <div className="bg-[var(--color-win-bg)] p-4">
              {isSuccess ? (
                <div className="p-8 flex flex-col items-center justify-center text-center bg-white win-inset">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-blue-50 text-[var(--color-win-blue)] rounded-full flex items-center justify-center mb-6 border-2 border-dotted border-[var(--color-win-blue)]"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                  </motion.div>
                  <h2 className="text-lg font-black text-black mb-2 uppercase italic">Success Authenticated</h2>
                  <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest italic opacity-60">Synchronizing transaction ledger...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((pm) => {
                      const Icon = paymentIcons[pm.value as PaymentMethod];
                      const isActive = method === pm.value;
                      return (
                        <button
                          key={pm.value}
                          type="button"
                          onClick={() => setMethod(pm.value as PaymentMethod)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 win-outset transition-all group",
                            isActive 
                              ? "bg-white border-2 border-dotted border-[var(--color-win-blue)] shadow-none translate-x-[1px] translate-y-[1px]" 
                              : "bg-[var(--color-win-bg)] hover:bg-gray-50"
                          )}
                        >
                          <Icon className={cn("w-5 h-5", isActive ? "text-[var(--color-win-blue)]" : "text-gray-400 group-hover:text-blue-600")} />
                          <span className={cn("font-black uppercase tracking-widest text-[9px]", isActive ? "text-[var(--color-win-blue)]" : "text-gray-600")}>
                            {pm.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end px-1 italic">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Obligation</label>
                        <span className="text-2xl font-black text-black tracking-tighter leading-none">₱{total.toLocaleString()}</span>
                    </div>

                    <div className="p-4 win-inset bg-white space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Input Received Funds</label>
                        <div className="flex items-center">
                          <span className="text-2xl font-black text-gray-400 mr-2">₱</span>
                          <input
                            type="number"
                            autoFocus
                            step="0.01"
                            value={received}
                            onChange={(e) => setReceived(e.target.value)}
                            className="w-full bg-transparent text-black text-4xl font-black focus:outline-none transition-all py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tracking-tighter italic"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-dotted border-gray-200">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Return Delta</p>
                        <p className="text-xl font-black text-[var(--color-win-blue)] tracking-tighter italic">₱{change.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="win-button flex-1 py-3 text-[10px] font-black uppercase tracking-widest"
                    >
                      Abort
                    </button>
                    <button
                      type="submit"
                      disabled={parseFloat(received) < total}
                      className="win-button flex-[2] py-3 text-[var(--color-win-blue)] disabled:text-gray-400 font-bold text-[10px] uppercase tracking-widest underline decoration-2 underline-offset-4"
                    >
                      Authorize Settlement
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
