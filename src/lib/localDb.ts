
import { Product, Sale, User, Notification, Category, Supplier, AuditLog } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'fleximart_products',
  SALES: 'fleximart_sales',
  USERS: 'fleximart_users',
  NOTIFICATIONS: 'fleximart_notifications',
  CATEGORIES: 'fleximart_categories',
  SUPPLIERS: 'fleximart_suppliers',
  AUDIT_LOGS: 'fleximart_audit_logs'
};

class LocalDB {
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
    // Dispatch a storage event for cross-tab or component updates
    window.dispatchEvent(new Event('storage_update'));
  }

  // Generic CRUD
  getAll<T>(key: string): T[] {
    return this.get<T>(key);
  }

  getOne<T extends { id: string }>(key: string, id: string): T | undefined {
    return this.get<T>(key).find(item => item.id === id);
  }

  add<T>(key: string, item: T): string {
    const id = (item as any).id || Math.random().toString(36).substring(2, 15);
    const newItem = { ...item, id };
    const data = this.get<T>(key);
    this.set(key, [...data, newItem]);
    return id;
  }

  update<T extends { id: string }>(key: string, id: string, updates: Partial<T>) {
    const data = this.get<T>(key);
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      data[index] = { ...(data[index] as any), ...updates };
      this.set(key, data);
    }
  }

  delete(key: string, id: string) {
    const data = this.getAll<any>(key);
    this.set(key, data.filter(item => item.id !== id && item.uid !== id));
  }
}

export const localDb = new LocalDB();
export { STORAGE_KEYS };
