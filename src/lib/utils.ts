import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES').format(new Date(date));
}

export function formatCompactCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 1000000) {
    // Millions
    return `${sign}${(absAmount / 1000000).toFixed(1).replace('.0', '')}M €`;
  } else if (absAmount >= 1000) {
    // Thousands
    return `${sign}${(absAmount / 1000).toFixed(1).replace('.0', '')}k €`;
  } else {
    // Less than 1000
    return `${sign}${absAmount.toFixed(0)} €`;
  }
}
