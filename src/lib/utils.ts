import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

export function generateBarcode(categoryCode: string, price: number, itemId: string) {
  const priceCode = Math.floor(price).toString().padStart(3, '0');
  const shortId = itemId.slice(-6).toUpperCase();
  return `${categoryCode}-${priceCode}-${shortId}`;
}
