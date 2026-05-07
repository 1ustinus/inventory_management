import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Delete, Divide, Minus, Plus, Equal, Hash } from 'lucide-react';
import { cn } from '../lib/utils';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Calculator({ isOpen, onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleNumber = (n: string) => {
    setDisplay(prev => prev === '0' ? n : prev + n);
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const fullEq = equation + display;
      // Note: In production use a proper math library, eval is dangerous
      // But for this controlled widget it's okay for demo
      const result = eval(fullEq.replace('×', '*').replace('÷', '/'));
      setDisplay(String(result));
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const buttons = [
    { label: 'C', onClick: clear, className: 'text-rose-500 font-black' },
    { label: '÷', onClick: () => handleOperator('÷'), className: 'text-emerald-500' },
    { label: '×', onClick: () => handleOperator('×'), className: 'text-emerald-500' },
    { label: '⌫', onClick: () => setDisplay(d => d.slice(0, -1) || '0'), className: 'text-emerald-500' },
    { label: '7', onClick: () => handleNumber('7') },
    { label: '8', onClick: () => handleNumber('8') },
    { label: '9', onClick: () => handleNumber('9') },
    { label: '-', onClick: () => handleOperator('-'), className: 'text-emerald-500' },
    { label: '4', onClick: () => handleNumber('4') },
    { label: '5', onClick: () => handleNumber('5') },
    { label: '6', onClick: () => handleNumber('6') },
    { label: '+', onClick: () => handleOperator('+'), className: 'text-emerald-500' },
    { label: '1', onClick: () => handleNumber('1') },
    { label: '2', onClick: () => handleNumber('2') },
    { label: '3', onClick: () => handleNumber('3') },
    { label: '=', onClick: calculate, className: 'row-span-2 bg-emerald-500 text-black rounded-xl font-black text-xl hover:bg-emerald-400' },
    { label: '0', onClick: () => handleNumber('0'), className: 'col-span-2' },
    { label: '.', onClick: () => handleNumber('.') },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 right-8 w-72 win-outset shadow-2xl z-[200] overflow-hidden p-1"
        >
          <div className="win-header">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Logic Module</span>
            </div>
            <button onClick={onClose} className="win-button h-5 w-5 flex items-center justify-center p-0 text-[10px]">X</button>
          </div>

          <div className="p-5 bg-[var(--color-win-bg)]">
            <div className="mb-4 win-inset bg-white p-4 text-right">
              <p className="text-[9px] text-gray-500 h-4 font-mono font-bold tracking-tighter uppercase">{equation}</p>
              <p className="text-2xl font-black text-[var(--color-win-text)] font-mono overflow-x-auto whitespace-nowrap scrollbar-hide tracking-tighter italic">
                {display}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {buttons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.onClick}
                  className={cn(
                    "h-11 flex items-center justify-center font-bold text-sm win-button",
                    btn.className === 'row-span-2 bg-emerald-500 text-black rounded-xl font-black text-xl hover:bg-emerald-400' 
                      ? "row-span-2 bg-emerald-500 text-white !h-[94px] !p-0" 
                      : "",
                    btn.className
                  )}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
