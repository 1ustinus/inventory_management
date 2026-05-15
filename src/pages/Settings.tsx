import React, { useState } from 'react';
import { 
  User, 
  Store, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  Check,
  Smartphone,
  CreditCard,
  Mail,
  Camera,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  STORE_NAME, 
  STORE_ADDRESS, 
  STORE_PHONE,
  MODULE_PERMISSIONS,
  MODULE_BACKUP
} from '../constants';
import { PERMISSION_LABELS } from '../lib/permissions';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [notifications, setNotifications] = useState({
    lowStock: true,
    outOfStock: true,
    damagedGoods: true,
    systemLogs: false
  });

  const tabs = [
    { label: 'Profile', icon: User },
    { label: 'Store Info', icon: Store },
    { label: 'Notifications', icon: Bell },
    { label: 'Permissions', icon: Shield },
    { label: 'Backup', icon: Database },
  ];

  const handleToggleNotify = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-4 space-y-4 max-w-[1200px] mx-auto min-h-screen bg-[var(--color-win-bg)] font-sans">
      <header className="win-outset p-2 flex justify-between items-center bg-[var(--color-win-bg)]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <h1 className="text-sm font-black text-[var(--color-win-text)] tracking-tight uppercase">SysConfig - Central Protocol Control</h1>
        </div>
        <div className="flex gap-1">
          <div className="w-4 h-4 win-outset flex items-center justify-center text-[10px] pb-0.5">_</div>
          <div className="w-4 h-4 win-outset flex items-center justify-center text-[10px]">X</div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Settings Sidebar */}
        <div className="space-y-1 win-outset p-1 bg-[var(--color-win-bg)] h-fit">
          <div className="win-header px-2 py-0.5 mb-1 text-[10px] font-bold">DIRECTORY</div>
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-1.5 transition-all font-black text-[10px] uppercase tracking-tighter",
                activeTab === tab.label 
                  ? "win-inset bg-white/50 text-[var(--color-win-blue)] border-2 border-dotted" 
                  : "hover:bg-gray-100 text-gray-800"
              )}
            >
              <tab.icon className={cn("w-4 h-4", activeTab === tab.label ? "text-[var(--color-win-blue)]" : "text-gray-600")} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 win-outset p-1 bg-[var(--color-win-bg)]">
           <div className="win-header px-2 py-0.5 mb-1 text-[10px] font-bold">MODULE_{activeTab.toUpperCase().replace(' ', '_')}</div>
           
           <AnimatePresence mode="wait">
              {activeTab === 'Profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 space-y-6"
                >
                  <div className="flex items-center gap-6 win-inset bg-white p-4">
                     <div className="relative">
                        <div className="w-16 h-16 win-outset bg-[var(--color-win-bg)] flex items-center justify-center text-[var(--color-win-blue)] font-black text-2xl italic">
                           M
                        </div>
                        <button className="absolute -bottom-1 -right-1 p-1 win-button text-gray-600">
                           <Camera className="w-3 h-3" />
                        </button>
                     </div>
                     <div>
                        <h3 className="text-base font-black text-[var(--color-win-text)] italic uppercase leading-none">Manager Alpha</h3>
                        <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest mt-1">manager@fleximart.local</p>
                        <div className="mt-2 flex gap-2">
                           <span className="px-1.5 py-0.5 border border-[var(--color-win-blue)] text-[var(--color-win-blue)] text-[8px] font-black uppercase italic">Identity Verified</span>
                           <span className="px-1.5 py-0.5 border border-red-700 text-red-700 text-[8px] font-black uppercase italic">Privilege: LVL_4</span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="win-label text-[10px] uppercase block">Handle</label>
                        <input type="text" defaultValue="Manager Admin" className="win-input w-full px-2" />
                     </div>
                     <div className="space-y-1">
                        <label className="win-label text-[10px] uppercase block">Secure Channel</label>
                        <input type="email" readOnly defaultValue="manager@fleximart.local" className="win-input w-full px-2 bg-gray-50 text-gray-700 italic" />
                     </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--color-win-dark)] flex justify-end gap-2">
                     <button className="win-button px-4 py-1 text-[10px] font-black uppercase">Abort</button>
                     <button className="win-button px-6 py-1 bg-white text-[var(--color-win-blue)] font-black text-[10px] uppercase flex items-center gap-2 underline decoration-2">
                        <Check className="w-3.5 h-3.5" /> Commit Preferences
                     </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'Store Info' && (
                <motion.div
                  key="store-info"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 space-y-6"
                >
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="win-label text-[10px] uppercase block">Entity Name</label>
                        <input type="text" defaultValue={STORE_NAME} className="win-input w-full px-2 h-7" />
                     </div>
                     <div className="space-y-1">
                        <label className="win-label text-[10px] uppercase block">Operational Location</label>
                        <textarea defaultValue={STORE_ADDRESS} className="win-input w-full px-2 py-1 h-20 resize-none italic" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="win-label text-[10px] uppercase block">Communication Line</label>
                           <input type="text" defaultValue={STORE_PHONE} className="win-input w-full px-2 h-7" />
                        </div>
                        <div className="space-y-1">
                           <label className="win-label text-[10px] uppercase block">Taxation Matrix (%)</label>
                           <input type="number" defaultValue="12" className="win-input w-full px-2 h-7" />
                        </div>
                     </div>
                  </div>
                  <div className="pt-4 border-t border-[var(--color-win-dark)] flex justify-end">
                     <button className="win-button px-6 py-1 text-[10px] font-black uppercase underline decoration-1 underline-offset-4">Save Registry</button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'Notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 space-y-6"
                >
                   <div className="win-inset bg-white/40 p-4 space-y-4">
                      <h3 className="text-xs font-black text-[var(--color-win-blue)] uppercase underline mb-2">Protocol Control Notification</h3>
                      
                      <div className="space-y-2">
                        {[
                          { key: 'lowStock', label: 'Protocol_01: Low stock alert (Under Re-Order Pt)' },
                          { key: 'outOfStock', label: 'Protocol_02: Out of Stock critical shutdown' },
                          { key: 'damagedGoods', label: 'Protocol_03: Damaged goods logging alert' },
                          { key: 'systemLogs', label: 'Protocol_04: System session log journaling' }
                        ].map((p) => (
                          <div key={p.key} className="flex items-center justify-between p-2 win-outset bg-[var(--color-win-bg)]">
                            <span className="text-[10px] font-black text-gray-800 uppercase italic">{p.label}</span>
                            <button 
                              onClick={() => handleToggleNotify(p.key as keyof typeof notifications)}
                              className={cn(
                                "win-button px-3 py-1 text-[9px] font-black uppercase transition-all",
                                notifications[p.key as keyof typeof notifications] 
                                  ? "bg-white text-[var(--color-win-blue)] border-2 border-dotted" 
                                  : "text-gray-400"
                              )}
                            >
                              {notifications[p.key as keyof typeof notifications] ? "[ ON ]" : "[ OFF ]"}
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 p-3 win-inset bg-white text-[9px] font-black text-red-700 uppercase italic">
                        Warning: Protocol notifications are dispatched through internal system channels. Ensure sound drivers are active.
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'Permissions' && (
                <motion.div
                  key="permissions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 space-y-4"
                >
                   <div className="win-inset bg-white/40 p-4">
                      <h3 className="text-xs font-black text-[var(--color-win-blue)] uppercase underline mb-4">Master Privilege Matrix</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(PERMISSION_LABELS).map(([id, label]) => (
                          <div key={id} className="flex items-center justify-between p-2 win-outset bg-[var(--color-win-bg)]">
                            <div className="flex flex-col">
                               <span className="text-[9px] font-black text-gray-800 uppercase tracking-tighter">{label}</span>
                               <span className="text-[7px] text-gray-500 font-mono opacity-60">ID: {id}</span>
                            </div>
                            <div className="win-inset px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase">Active</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                         <div className="win-inset p-2 bg-gray-50 text-center">
                            <span className="block text-[7px] text-gray-500 font-bold uppercase">Version</span>
                            <span className="text-[10px] font-black text-[var(--color-win-blue)]">{MODULE_PERMISSIONS.version}</span>
                         </div>
                         <div className="win-inset p-2 bg-gray-50 text-center">
                            <span className="block text-[7px] text-gray-500 font-bold uppercase">Audit</span>
                            <span className="text-[10px] font-black text-[var(--color-win-blue)]">{MODULE_PERMISSIONS.lastSecurityAudit}</span>
                         </div>
                         <div className="win-inset p-2 bg-gray-50 text-center">
                            <span className="block text-[7px] text-gray-500 font-bold uppercase">Clearance</span>
                            <span className="text-[10px] font-black text-[var(--color-win-blue)]">LVL_{MODULE_PERMISSIONS.maxClearanceLevel}</span>
                         </div>
                      </div>

                      <div className="mt-6 p-3 win-inset bg-blue-50 text-blue-900 text-[9px] font-black uppercase italic leading-normal">
                        System Policy: Permissions are defined in the core protocol. To re-assign clearances, navigate to Registry & Personnel.
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'Backup' && (
                <motion.div
                  key="backup"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 space-y-6"
                >
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="win-outset p-4 bg-white/40 space-y-4">
                         <h3 className="text-[10px] font-black uppercase text-[var(--color-win-text)] flex items-center gap-2">
                            <Database className="w-3.5 h-3.5" /> Data Preservation
                         </h3>
                         <p className="text-[9px] font-bold text-gray-600 italic">Generate a complete system state snapshot for disaster recovery.</p>
                         <button className="win-button w-full py-2 bg-emerald-700 text-white font-black text-[10px] uppercase shadow-[2px_2px_0] shadow-emerald-900/40">
                            Download_Global_Snapshot.json
                         </button>
                      </div>

                      <div className="win-outset p-4 bg-white/40 space-y-4 text-red-900 border-red-200">
                         <h3 className="text-[10px] font-black uppercase flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5" /> Restore Matrix
                         </h3>
                         <p className="text-[9px] font-bold italic">Warning: Manual restoration will overwrite current operational registry.</p>
                         <button className="win-button w-full py-2 border-red-700 text-red-700 font-black text-[10px] uppercase italic">
                            Initialize_Recall_Sequence
                         </button>
                      </div>
                   </div>

                   <div className="win-inset bg-white/40 p-4">
                      <h4 className="text-[8px] font-black uppercase text-gray-500 mb-3 border-b pb-1">Operational Parameters</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div>
                            <span className="block text-[7px] text-gray-400 font-bold uppercase">Auto-sync</span>
                            <span className="text-[10px] font-black uppercase">{MODULE_BACKUP.autoBackupEnabled ? 'Enabled' : 'Disabled'}</span>
                         </div>
                         <div>
                            <span className="block text-[7px] text-gray-400 font-bold uppercase">Interval</span>
                            <span className="text-[10px] font-black uppercase">{MODULE_BACKUP.backupInterval}</span>
                         </div>
                         <div>
                            <span className="block text-[7px] text-gray-400 font-bold uppercase">Retention</span>
                            <span className="text-[10px] font-black uppercase">{MODULE_BACKUP.retentionPolicy}</span>
                         </div>
                         <div>
                            <span className="block text-[7px] text-gray-400 font-bold uppercase">Vault</span>
                            <span className="text-[10px] font-black uppercase">{MODULE_BACKUP.cloudProvider}</span>
                         </div>
                      </div>
                   </div>

                   <div className="win-inset bg-gray-50 p-4">
                      <div className="flex items-center justify-between mb-4 border-b pb-2">
                         <span className="text-[10px] font-black uppercase">Retention Logs</span>
                         <span className="text-[8px] font-mono opacity-50">Sectors: 2048/2048</span>
                      </div>
                      <div className="space-y-1 font-mono text-[8px] text-gray-500 uppercase">
                         <div className="flex justify-between">
                            <span>[ 2026-05-15 08:30 ] Cloud_Sync_Protocol: Successful</span>
                            <span className="text-emerald-700">OK</span>
                         </div>
                         <div className="flex justify-between">
                            <span>[ 2026-05-14 23:59 ] Auto_Archive_Daily: Compressed</span>
                            <span className="text-emerald-700">OK</span>
                         </div>
                         <div className="flex justify-between">
                            <span>[ 2026-05-14 12:00 ] Checkpoint_Alpha: Verified</span>
                            <span className="text-emerald-700">OK</span>
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
