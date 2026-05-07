import { User, Permission, UserRole } from '../types';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'inventory:view', 'inventory:edit', 'inventory:delete',
    'sales:view', 'sales:void', 'pos:access',
    'users:view', 'users:manage',
    'reports:view', 'reports:export'
  ],
  manager: [
    'inventory:view', 'inventory:edit',
    'sales:view', 'sales:void', 'pos:access',
    'users:view',
    'reports:view', 'reports:export'
  ],
  inventory: [
    'inventory:view'
  ],
  cashier: [
    'inventory:view',
    'sales:view', 'pos:access'
  ]
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  'inventory:view': 'View Inventory',
  'inventory:edit': 'Edit Inventory',
  'inventory:delete': 'Delete Inventory',
  'sales:view': 'View Sales History',
  'sales:void': 'Void Sales',
  'pos:access': 'Access POS Terminal',
  'users:view': 'View Users',
  'users:manage': 'Manage Users',
  'reports:view': 'View Reports',
  'reports:export': 'Export Reports'
};

export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  
  // Admin has everything
  if (user.role === 'admin') return true;
  
  const defaultPermissions = ROLE_PERMISSIONS[user.role] || [];
  const userPermissions = user.permissions || [];
  
  const allPermissions = [...new Set([...defaultPermissions, ...userPermissions])];
  
  return allPermissions.includes(permission);
}
