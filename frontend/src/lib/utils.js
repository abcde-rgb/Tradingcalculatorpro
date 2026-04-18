import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

export function formatCurrency(num, currency = 'USD') {
  if (num === null || num === undefined || isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency
  }).format(num);
}

export function formatPercentage(num) {
  if (num === null || num === undefined || isNaN(num)) return '0%';
  return `${num >= 0 ? '+' : ''}${formatNumber(num)}%`;
}
