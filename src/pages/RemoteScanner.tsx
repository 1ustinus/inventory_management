import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Smartphone, Scan, CheckCircle2, AlertCircle, Wifi, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function RemoteScanner() {
  const { stationId } = useParams<{ stationId: string }>();
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "remote-reader",
      { 
        fps: 15, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        try {
          setStatus('scanning');
          const response = await fetch(`/api/station/${stationId}/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ barcode: decodedText }),
            signal: controller.signal
          });

          if (response.ok) {
            setLastScan(decodedText);
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
          } else {
            throw new Error('Transmission Failure');
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
             console.warn('Scan transmission timed out');
          }
          setStatus('error');
          setErrorMessage(err.message === 'Transmission Failure' ? 'LINK_FAILURE: DATA_NOT_SENT' : 'TIMEOUT_ERR: TRY_AGAIN');
          setTimeout(() => setStatus('idle'), 3000);
        } finally {
          clearTimeout(timeoutId);
        }
      },
      (error) => {
        // Ignored
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [stationId]);

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6 border-b border-white/20 pb-4">
        <div className="flex items-center gap-3">
          <Smartphone className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.2em]">Remote_Link_Scanner</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase italic">Station_ID: {stationId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
           <span className="text-[8px] font-black uppercase tracking-widest opacity-60">LINK_ACTIVE</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        <div className="win-outset p-1 bg-[#c0c0c0] shadow-xl relative">
          <div className="win-header flex items-center gap-2 px-1 py-0.5 mb-1 !bg-blue-900">
             <Camera className="w-3 h-3 text-white" />
             <span className="text-[9px] font-black text-white uppercase italic">Optical_Input_1</span>
          </div>
          <div className="win-inset bg-black aspect-square overflow-hidden relative">
             <div id="remote-reader"></div>
             
             {/* Scanning Line overlay */}
             <div className="absolute inset-0 pointer-events-none border-2 border-blue-500/20 m-4">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/60 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
             </div>

             <AnimatePresence>
               {status === 'success' && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center p-6 text-center"
                 >
                    <CheckCircle2 className="w-16 h-16 mb-4 text-white drop-shadow-lg" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">DATA_INDEXED!</h2>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-2">{lastScan}</p>
                 </motion.div>
               )}
               {status === 'error' && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 bg-red-600/90 flex flex-col items-center justify-center p-6 text-center"
                 >
                    <AlertCircle className="w-16 h-16 mb-4 text-white" />
                    <h2 className="text-xl font-black uppercase tracking-widest">TRANSMISSION_ERR</h2>
                    <p className="text-[10px] font-bold uppercase opacity-80 mt-2">{errorMessage}</p>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

        <div className="win-inset bg-white/10 p-4 border border-white/5 backdrop-blur-md">
           <div className="flex items-center gap-3 mb-2">
             <Wifi className="w-5 h-5 text-blue-400" />
             <h3 className="text-[10px] font-black uppercase tracking-widest">Telemetry_State</h3>
           </div>
           <div className="space-y-1">
             <div className="flex justify-between text-[11px] font-bold italic">
               <span className="opacity-40 uppercase">Latency</span>
               <span className="text-blue-400 uppercase">24ms (NOMINAL)</span>
             </div>
             <div className="flex justify-between text-[11px] font-bold italic">
               <span className="opacity-40 uppercase">Last_ID</span>
               <span className="truncate max-w-[150px] uppercase">{lastScan || 'PENDING...'}</span>
             </div>
           </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
         <div className="text-[9px] font-bold text-center opacity-40 uppercase tracking-[0.2em] italic">
           Proprietary Scanning Matrix v4.2.0
         </div>
      </div>
    </div>
  );
}
