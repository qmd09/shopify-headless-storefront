import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: { amount: string; currencyCode: string }): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: price.currencyCode || 'NZD',
    minimumFractionDigits: 2,
  }).format(parseFloat(price.amount));
}
