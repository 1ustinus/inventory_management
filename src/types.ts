export type UserRole = 'admin' | 'manager' | 'inventory' | 'cashier';

export type Permission = 
  | 'inventory:view' 
  | 'inventory:edit' 
  | 'inventory:delete'
  | 'sales:view' 
  | 'sales:void'
  | 'pos:access'
  | 'users:view' 
  | 'users:manage'
  | 'reports:view'
  | 'reports:export';

export interface User {
  id?: string;
  uid: string;
  username?: string;
  password?: string;
  email: string;
  displayName: string;
  role: UserRole;
  permissions?: Permission[];
  photoURL?: string;
  createdAt: string;
  lastLogin: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  barcode: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  imageUrl?: string;
  supplierId?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = 'cash' | 'gcash';

export interface Sale {
  id: string;
  transactionId: string;
  cashierId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  change: number;
  status: 'completed' | 'voided';
  isSynced?: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export type NotificationType = 'low_stock' | 'out_of_stock' | 'damaged' | 'expiry' | 'sale' | 'account';

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}
