import { localDb, STORAGE_KEYS } from '../lib/localDb';
import { CATEGORIES } from '../constants';
import { generateBarcode } from '../lib/utils';
import { Product, Category, User } from '../types';

export async function seedInitialData() {
  const users = localDb.getAll<User>(STORAGE_KEYS.USERS);
  if (users.length === 0) {
    localDb.add<User>(STORAGE_KEYS.USERS, {
      uid: 'manager-node-01',
      username: 'manager',
      password: 'manager123',
      email: 'manager@fleximart.local',
      displayName: 'Manager Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    });
  }

  const products = localDb.getAll<Product>(STORAGE_KEYS.PRODUCTS);
  if (products.length > 0) return; // Already seeded

  console.log('Seeding initial data to LocalStorage...');

  const sampleProducts = [
    { name: "Purefoods Corned Beef 150g", price: 65, costPrice: 48, stock: 8, minStock: 10, category: "Canned Goods", image: "https://picsum.photos/seed/beef/200/200" },
    { name: "Coke Original 1.5L", price: 75, costPrice: 62, stock: 5, minStock: 10, category: "Beverages", image: "https://picsum.photos/seed/beverage1/200/200" },
    { name: "Pancit Canton Extra Hot", price: 18, costPrice: 14, stock: 4, minStock: 10, category: "Instant Noodles", image: "https://picsum.photos/seed/noodles/200/200" },
    { name: "Gardenia Classic Loaf", price: 85, costPrice: 72, stock: 3, minStock: 15, category: "Bread & Bakery", image: "https://picsum.photos/seed/bread/200/200" },
    { name: "Kopiko Lucky Day", price: 25, costPrice: 20, stock: 48, category: "Beverages", image: "https://picsum.photos/seed/coffee/200/200" },
    { name: "San Miguel Pale Pilsen 320ml", price: 55, costPrice: 45, stock: 6, minStock: 10, category: "Beverages", image: "https://picsum.photos/seed/beer/200/200" },
    { name: "Safeguard White 130g", price: 45, costPrice: 38, stock: 2, minStock: 10, category: "Toiletries", image: "https://picsum.photos/seed/soap/200/200" },
    { name: "Colgate Triple Action 150g", price: 95, costPrice: 78, stock: 20, category: "Toiletries", image: "https://picsum.photos/seed/toothpaste/200/200" },
    { name: "Silver Swan Soy Sauce 1L", price: 52, costPrice: 42, stock: 15, category: "Condiments", image: "https://picsum.photos/seed/soy/200/200" },
    { name: "Datu Puti Vinegar 1L", price: 48, costPrice: 38, stock: 15, category: "Condiments", image: "https://picsum.photos/seed/vinegar/200/200" }
  ];

  for (const sp of sampleProducts) {
    const category = CATEGORIES.find(c => c.name === sp.category);
    const categoryCode = category?.code || "GEN";
    const itemId = Math.random().toString(36).substring(7).toUpperCase();
    const barcode = generateBarcode(categoryCode, sp.price, itemId);

    localDb.add<Product>(STORAGE_KEYS.PRODUCTS, {
      id: Math.random().toString(36).substring(7),
      name: sp.name,
      price: sp.price,
      costPrice: sp.costPrice,
      stockQuantity: sp.stock,
      minStockLevel: (sp as any).minStock || 10,
      category: sp.category,
      sku: `SKU-${barcode}`,
      barcode: barcode,
      imageUrl: sp.image,
      unit: 'pcs',
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Seed Notifications
  localDb.add(STORAGE_KEYS.NOTIFICATIONS, {
    id: 'init-ping',
    title: "System Local Ready",
    message: "Firebase was bypassed. Your records are now stored locally in this browser.",
    type: "account",
    isRead: false,
    createdAt: new Date().toISOString()
  });

  console.log('Local seeding complete.');
}
