import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Scan, Info } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export default function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
        onClose();
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [isOpen, onScan, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="win-outset p-1 bg-[var(--color-win-bg)] max-w-md w-full shadow-2xl"
          >
            <div className="win-header flex justify-between items-center px-2 py-1 mb-1">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest">Optical_Sensor_Matrix</h3>
              </div>
              <button 
                onClick={onClose}
                className="win-button px-1 h-5 w-5 text-xs flex items-center justify-center font-bold"
              >
                X
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="win-inset bg-black p-2 min-h-[300px] flex items-center justify-center relative overflow-hidden">
                <div id="reader" className="w-full"></div>
                
                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500/30 blur-sm animate-[scan_2s_ease-in-out_infinite] pointer-events-none"></div>
              </div>

              <div className="win-inset bg-white/40 p-3 italic">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold text-gray-700 leading-tight uppercase">
                    Align barcode within the target aperture for automated indexing. Ensure adequate illumination of the target surface.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="win-button w-full py-2 font-black uppercase text-xs"
              >
                Deactivate Scanner
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
