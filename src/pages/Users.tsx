import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Shield, 
  Trash2, 
  Mail, 
  Search,
  MoreVertical,
  CheckCircle2,
  Edit,
  Database,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { localDb, STORAGE_KEYS } from '../lib/localDb';
import { User } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import UserModal from '../components/UserModal';
import { hasPermission } from '../lib/permissions';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const authData = localStorage.getItem('flexi-auth');
    if (authData) setCurrentUser(JSON.parse(authData));

    const updateUsers = () => {
      setUsers(localDb.getAll<User>(STORAGE_KEYS.USERS));
    };
    updateUsers();
    window.addEventListener('storage_update', updateUsers);
    return () => window.removeEventListener('storage_update', updateUsers);
  }, []);

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const canView = hasPermission(currentUser, 'users:view');
  const canManage = hasPermission(currentUser, 'users:manage');

  if (!canView && currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
         <motion.div 
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="win-outset p-8 md:p-12 flex flex-col items-center bg-[var(--color-win-bg)] shadow-2xl max-w-lg w-full"
         >
            <div className="win-header w-full mb-6 !bg-red-900 px-2 py-1 flex items-center gap-2">
               <Shield className="w-3.5 h-3.5 text-white" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Access_Denied_Terminal</span>
            </div>
            
            <div className="win-inset bg-white p-6 flex flex-col items-center mb-6 w-full">
               <Shield className="w-16 h-16 text-red-700 mb-4 animate-pulse opacity-20" />
               <h2 className="text-xl font-black text-red-700 uppercase italic tracking-widest border-b-4 border-red-700 pb-2 mb-4 text-center">Protocol Violation</h2>
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter text-center italic">
                 Identity signature [{(currentUser?.displayName || 'UNKNOWN').toUpperCase()}] lacks required analytical clearances (users:view).
               </p>
            </div>

            <div className="w-full flex justify-center">
               <button 
                 onClick={() => window.location.hash = '#/'}
                 className="win-button px-10 py-2 text-[10px] font-black uppercase text-blue-900 border-blue-900 shadow-[4px_4px_0] shadow-blue-900/20 active:translate-y-[2px]"
               >
                 Return to Dashboard
               </button>
            </div>
         </motion.div>
      </div>
    );
  }

  const handleDeleteUser = (id?: string) => {
    if (!id) {
      console.warn('ID missing for decommission protocol.');
      return;
    }
    
    // Safety check: Cannot delete self
    const authData = localStorage.getItem('flexi-auth');
    const authUser = authData ? JSON.parse(authData) : null;
    const currentId = authUser?.id || authUser?.uid;

    if (currentId === id) {
      alert("CRITICAL ERROR: Cannot decommission active operative session. Identity protection enabled.");
      return;
    }

    if (confirm('Decommission this account? All associated privileges will be revoked.')) {
      try {
        localDb.delete(STORAGE_KEYS.USERS, id);
        // Explicitly refresh state to ensure immediate UI update
        setUsers(localDb.getAll<User>(STORAGE_KEYS.USERS));
        console.log(`Operative ${id} decommissioned.`);
      } catch (err) {
        console.error('Decommission failure:', err);
      }
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="p-4 space-y-6 max-w-[1400px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-[var(--color-win-blue)]" />
            <h1 className="text-xl font-black text-[var(--color-win-text)] tracking-tight uppercase">Registry & Personnel</h1>
          </div>
          <p className="text-gray-600 font-bold italic text-xs">Administrative oversight for system access and operative roles.</p>
        </div>
        {canManage && (
          <button 
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="win-button px-5 py-2 text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Provision Member
          </button>
        )}
      </header>

      <div className="win-outset bg-[var(--color-win-bg)] flex flex-col shadow-xl overflow-hidden p-1">
        <div className="win-header mb-1">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">Query Registry</span>
          </div>
        </div>

        <div className="p-3 border-b border-[var(--color-win-dark)] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <input 
              type="text"
              placeholder="Query by Name or Identifier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="win-input w-full pl-8 h-8 text-[11px] font-bold"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 px-3 h-8 win-inset bg-white/40 text-[10px] font-black uppercase tracking-widest text-[var(--color-win-text)] opacity-80">
                <UsersIcon className="w-3.5 h-3.5 text-[var(--color-win-blue)]" />
                {users.length} Operatives
             </div>
          </div>
        </div>

        <div className="overflow-x-auto win-inset bg-white custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#E0E0E0] text-black text-[10px] font-black uppercase tracking-widest border-b border-[var(--color-win-dark)]">
                <th className="px-6 py-2 border-r border-[var(--color-win-dark)] italic">Identity Unit</th>
                <th className="px-6 py-2 border-r border-[var(--color-win-dark)] italic">Security Level</th>
                <th className="px-6 py-2 border-r border-[var(--color-win-dark)] hidden lg:table-cell italic">Last Sync</th>
                <th className="px-6 py-2 border-r border-[var(--color-win-dark)] hidden md:table-cell italic">Verification</th>
                <th className="px-6 py-2 text-right">
                  <div className="flex flex-col items-end">
                    <span className="italic text-[10px] text-blue-900 font-black decoration-blue-700/50 underline-offset-4">OPS</span>
                    <span className="text-[7px] text-gray-500 font-bold uppercase tracking-tighter opacity-50">UNIT_MGMT</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
               {filteredUsers.map((user) => {
                 const userId = user.id || user.uid;
                 return (
                   <tr key={userId} className="hover:bg-blue-50 transition-all group border-b border-gray-100 italic font-bold">
                     <td className="px-6 py-2 border-r border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 win-outset flex items-center justify-center font-black text-[10px]",
                            user.role === 'admin' ? "bg-purple-100 text-purple-700" : 
                            user.role === 'manager' ? "bg-emerald-100 text-emerald-700" :
                            "bg-white text-[var(--color-win-blue)]"
                          )}>
                             {user.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-[var(--color-win-text)] uppercase tracking-tighter">{user.displayName}</p>
                            <p className="text-[9px] font-bold text-gray-700 flex items-center gap-1.5 lowercase">
                               <Mail className="w-2.5 h-2.5 opacity-80" /> {user.email}
                            </p>
                          </div>
                        </div>
                     </td>
                     <td className="px-6 py-2 border-r border-gray-100">
                        <div className="flex items-center gap-2">
                           <div className={cn(
                             "p-1 win-inset",
                             user.role === 'admin' ? "bg-purple-100 text-purple-700" : 
                             user.role === 'manager' ? "bg-emerald-100 text-emerald-700" :
                             "bg-blue-50 text-blue-700"
                           )}>
                             <Shield className="w-3 h-3" />
                           </div>
                           <span className={cn(
                             "text-[10px] font-black uppercase tracking-widest",
                             user.role === 'admin' ? "text-purple-700" : 
                             user.role === 'manager' ? "text-emerald-700" :
                             "text-blue-700"
                           )}>{user.role}</span>
                        </div>
                     </td>
                     <td className="px-6 py-2 border-r border-gray-100 hidden lg:table-cell">
                        <span className="text-[10px] text-gray-700 font-bold tracking-tighter">
                           {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, HH:mm') : 'None Recorded'}
                        </span>
                     </td>
                     <td className="px-6 py-2 border-r border-gray-100 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                           <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                           <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Authorized</span>
                        </div>
                     </td>
                     <td className="px-6 py-2 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          {canManage && (
                            <button 
                              onClick={() => handleEditUser(user)}
                              className="win-button p-1 text-[var(--color-win-blue)] hover:bg-blue-50"
                              title="Modify Operative Data"
                            >
                               <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canManage && (
                            <button 
                              onClick={() => handleDeleteUser(userId)}
                              className="win-button p-1 text-red-700 hover:bg-red-50"
                              title="Revoke System Access"
                            >
                               <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!canManage && (
                             <div className="p-1 opacity-20 grayscale cursor-not-allowed" title="Permission Required">
                               <Shield className="w-3.5 h-3.5" />
                             </div>
                          )}
                        </div>
                     </td>
                   </tr>
                 );
               })}
               {filteredUsers.length === 0 && (
                 <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                       <div className="flex flex-col items-center opacity-30">
                          <Terminal className="w-10 h-10 text-gray-400 mb-2" />
                          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.3em] italic">No Operatives found in Registry.</p>
                       </div>
                    </td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal isOpen={isModalOpen} onClose={closeModal} editingUser={editingUser} />
    </div>
  );
}
