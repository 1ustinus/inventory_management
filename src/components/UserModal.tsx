import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Shield, User as UserIcon, Lock, Terminal, CheckSquare, Square } from 'lucide-react';
import { STORAGE_KEYS } from '../lib/localDb';
import { firestoreDb } from '../lib/firestore';
import { User, UserRole, Permission } from '../types';
import { PERMISSION_LABELS, ROLE_PERMISSIONS } from '../lib/permissions';
import { cn } from '../lib/utils';

const userSchema = z.object({
  displayName: z.string().min(2, 'Name is required'),
  username: z.string().min(4, 'Username must be at least 4 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'inventory', 'cashier']),
  permissions: z.array(z.string()).optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser?: User | null;
}

export default function UserModal({ isOpen, onClose, editingUser }: UserModalProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: editingUser ? {
      displayName: editingUser.displayName,
      username: editingUser.username,
      password: editingUser.password,
      email: editingUser.email,
      role: editingUser.role,
      permissions: editingUser.permissions || [],
    } : {
      role: 'cashier',
      permissions: [],
    }
  });

  const selectedRole = watch('role');
  const selectedPermissions = watch('permissions') || [];

  // Reset form when editingUser changes
  React.useEffect(() => {
    if (editingUser) {
      reset({
        displayName: editingUser.displayName,
        username: editingUser.username || '',
        password: editingUser.password || '',
        email: editingUser.email,
        role: editingUser.role,
        permissions: editingUser.permissions || [],
      });
    } else {
      reset({
        displayName: '',
        username: '',
        password: '',
        email: '',
        role: 'cashier',
        permissions: [],
      });
    }
  }, [editingUser, reset]);

  const onSubmit = async (data: UserFormValues) => {
    try {
      const targetId = editingUser?.id || editingUser?.uid;

      // Role change protocols: confirmation required for identity re-classification
      if (editingUser && data.role !== editingUser.role) {
        const proceed = confirm(
          `SECURITY PROTOCOL: You are changing ${editingUser.displayName}'s clearance level from [${editingUser.role}] to [${data.role}]. \n\nContinue with operative re-classification?`
        );
        if (!proceed) return;
      }

      if (editingUser && targetId) {
        await firestoreDb.update<any>(STORAGE_KEYS.USERS, targetId, {
          ...data,
          permissions: data.permissions as Permission[],
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newUser: User = {
          uid: `u-${Math.random().toString(36).substring(7)}`,
          ...data,
          permissions: data.permissions as Permission[],
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        await firestoreDb.add<User>(STORAGE_KEYS.USERS, newUser);
      }
      
      // Auto notification in Cloud
      await firestoreDb.add(STORAGE_KEYS.NOTIFICATIONS, {
        title: editingUser ? "Operative Record Updated" : "New Operative Provisioned",
        message: editingUser 
          ? `${data.displayName} account parameters have been re-calibrated.`
          : `${data.displayName} has been granted ${data.role} access keys.`,
        type: "account",
        isRead: false,
        createdAt: new Date().toISOString()
      });

      reset();
      onClose();
    } catch (error) {
      console.error('Error adding/updating user:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
            className="relative w-full max-w-md win-outset shadow-2xl p-0.5 md:p-1 max-h-[95vh] flex flex-col"
          >
            <div className="win-header mb-1 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <h2 className="text-xs md:text-sm font-bold truncate">
                  {editingUser ? 'Sync Identity Record' : 'Operative Provisioning Wizard'}
                </h2>
              </div>
              <div className="flex gap-1">
                <button onClick={onClose} className="win-button p-0.5 h-5 w-5 flex items-center justify-center text-[10px]">X</button>
              </div>
            </div>

            <div className="bg-[var(--color-win-bg)] p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
               <div className="flex flex-col items-center mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 win-inset bg-white flex items-center justify-center mb-2">
                     <UserIcon className="w-6 h-6 md:w-8 md:h-8 text-[var(--color-win-blue)]" />
                  </div>
                  <p className="text-[9px] md:text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center">
                    {editingUser ? 'Modify Registry Entry' : 'Identity Registry Entry'}
                  </p>
               </div>

               <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
                  <div className="space-y-1">
                    <label className="win-label text-[9px] md:text-[10px] uppercase block">Full Name Identity:</label>
                    <input 
                      {...register('displayName')}
                      autoFocus
                      className="win-input w-full text-[11px]"
                      placeholder="e.g. Juan De La Cruz"
                    />
                    {errors.displayName && <p className="text-red-700 text-[9px] font-bold italic">{errors.displayName.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="win-label text-[9px] md:text-[10px] uppercase block">Access ID:</label>
                      <input 
                        {...register('username')}
                        className="win-input w-full text-[11px]"
                        placeholder="Login ID"
                      />
                      {errors.username && <p className="text-red-700 text-[9px] font-bold italic">{errors.username.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="win-label text-[9px] md:text-[10px] uppercase block">Passcode:</label>
                      <input 
                        type="password"
                        {...register('password')}
                        className="win-input w-full text-[11px]"
                        placeholder="••••••"
                      />
                      {errors.password && <p className="text-red-700 text-[9px] font-bold italic">{errors.password.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="win-label text-[9px] md:text-[10px] uppercase block">Signal Address (Email):</label>
                    <input 
                      {...register('email')}
                      className="win-input w-full text-[11px]"
                      placeholder="operative@fleximart.local"
                   />
                    {errors.email && <p className="text-red-700 text-[9px] font-bold italic">{errors.email.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="win-label text-[9px] md:text-[10px] uppercase block">Security Clearance:</label>
                      <div className="win-inset bg-white p-2 space-y-2">
                         {['admin', 'manager', 'inventory', 'cashier'].map((role) => (
                            <label key={role} className="flex items-center gap-2 cursor-pointer group">
                               <input 
                                 type="radio"
                                 value={role}
                                 {...register('role')}
                                 className="w-3 h-3 border-2 border-[var(--color-win-dark)] appearance-none checked:bg-[var(--color-win-blue)] checked:border-[var(--color-win-light)] shadow-[0_0_0_1px_var(--color-win-dark)]"
                               />
                               <span className="text-[9px] md:text-[10px] font-bold uppercase group-hover:text-[var(--color-win-blue)] transition-colors">
                                 {role} Access
                               </span>
                            </label>
                         ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                       <label className="win-label text-[9px] md:text-[10px] uppercase block">Sub-Perms / Overrides:</label>
                       <div className="win-inset bg-white p-2 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                          {selectedRole === 'admin' ? (
                            <div className="flex flex-col items-center justify-center p-4 text-center opacity-40">
                               <Shield className="w-8 h-8 mb-2" />
                               <span className="text-[8px] font-black uppercase">Full Master Access Enabled</span>
                            </div>
                          ) : (
                            Object.entries(PERMISSION_LABELS).map(([perm, label]) => {
                              const isDefault = ROLE_PERMISSIONS[selectedRole as UserRole]?.includes(perm as Permission);
                              const isSelected = selectedPermissions.includes(perm);
                              
                              return (
                                <label key={perm} className={cn(
                                  "flex items-center gap-2 cursor-pointer group p-1 transition-colors",
                                  isDefault ? "opacity-50 pointer-events-none" : ""
                                )}>
                                   <input 
                                     type="checkbox"
                                     value={perm}
                                     checked={isDefault || isSelected}
                                     onChange={(e) => {
                                       if (isDefault) return;
                                       const current = [...selectedPermissions];
                                       if (e.target.checked) {
                                         setValue('permissions', [...current, perm]);
                                       } else {
                                         setValue('permissions', current.filter(p => p !== perm));
                                       }
                                     }}
                                     className="hidden"
                                   />
                                   {(isDefault || isSelected) ? (
                                     <CheckSquare className={cn("w-3 h-3", isDefault ? "text-emerald-700" : "text-blue-700")} />
                                   ) : (
                                     <Square className="w-3 h-3 text-gray-400" />
                                   )}
                                   <div className="flex flex-col">
                                      <span className="text-[9px] font-bold uppercase group-hover:text-blue-900 leading-none">
                                        {label}
                                      </span>
                                      {isDefault && (
                                        <span className="text-[7px] text-emerald-800 font-black italic">DEFAULT_FOR_{selectedRole.toUpperCase()}</span>
                                      )}
                                   </div>
                                </label>
                              );
                            })
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                     <button type="button" onClick={onClose} className="win-button px-4 md:px-6 text-[10px] md:text-xs py-1.5">Abort</button>
                     <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="win-button px-4 md:px-6 text-[10px] md:text-xs py-1.5 bg-blue-100 flex items-center gap-2"
                      >
                        {isSubmitting ? 'Syncing...' : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            {editingUser ? 'Sync Record' : 'Provision'}
                          </>
                        )}
                     </button>
                  </div>
               </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
