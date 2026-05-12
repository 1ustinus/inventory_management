import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, Wifi, HelpCircle, Smartphone as Phone, Globe, Info } from 'lucide-react';

interface HotspotModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationId: string;
}

export default function HotspotModal({ isOpen, onClose, stationId }: HotspotModalProps) {
  const currentUrl = window.location.origin;
  const pairUrl = `${currentUrl}/remote-scan/${stationId}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="win-outset p-1 bg-[var(--color-win-bg)] max-w-sm w-full shadow-2xl"
          >
            <div className="win-header flex justify-between items-center px-2 py-1 mb-1">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest">Hotspot_Pairing_Protocol</h3>
              </div>
              <button 
                onClick={onClose}
                className="win-button px-1 h-5 w-5 text-xs flex items-center justify-center font-bold"
              >
                X
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div className="text-center space-y-2">
                 <h2 className="text-sm font-black uppercase italic tracking-tighter text-blue-900 border-b-2 border-blue-900 inline-block pb-1">Establish Wireless Link</h2>
                 <p className="text-[10px] text-gray-600 font-bold uppercase leading-tight italic">Scan the matrix below with a mobile device to initiate remote scanning mode.</p>
              </div>

              <div className="flex justify-center p-4 bg-white win-inset">
                <QRCodeSVG value={pairUrl} size={180} level="H" includeMargin />
              </div>

              <div className="space-y-3">
                 <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 win-inset bg-blue-100 flex items-center justify-center shrink-0">
                       <span className="text-[10px] font-black text-blue-900">01</span>
                    </div>
                    <div>
                       <h4 className="text-[9px] font-black uppercase text-gray-800">Verify Network</h4>
                       <p className="text-[8px] font-bold text-gray-500 uppercase italic">Mobile device must be on the same broadcast domain (Wi-Fi) as this terminal.</p>
                    </div>
                 </div>

                 <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 win-inset bg-blue-100 flex items-center justify-center shrink-0">
                       <span className="text-[10px] font-black text-blue-900">02</span>
                    </div>
                    <div>
                       <h4 className="text-[9px] font-black uppercase text-gray-800">Scan Matrix</h4>
                       <p className="text-[8px] font-bold text-gray-500 uppercase italic">Use camera app to identify the pattern and launch the Remote_Link interface.</p>
                    </div>
                 </div>

                 <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 win-inset bg-blue-100 flex items-center justify-center shrink-0">
                       <span className="text-[10px] font-black text-blue-900">03</span>
                    </div>
                    <div>
                       <h4 className="text-[9px] font-black uppercase text-gray-800">Begin Operation</h4>
                       <p className="text-[8px] font-bold text-gray-500 uppercase italic">Scanned barcodes will be tele-transferred to the current terminal buffer.</p>
                    </div>
                 </div>
              </div>

              <div className="win-inset bg-blue-900/10 p-2 flex items-center gap-2">
                 <Info className="w-4 h-4 text-blue-900" />
                 <p className="text-[8px] font-black text-blue-900 uppercase">Station_Link_Active: <span className="underline italic">{stationId}</span></p>
              </div>
              
              <button 
                onClick={onClose}
                className="win-button w-full py-2 font-black uppercase text-xs"
              >
                Close Connection Portal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
