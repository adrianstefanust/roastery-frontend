import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with thousand separators (.) and decimal separator (,)
 * Example: 1000 -> "1.000", 1000.50 -> "1.000,50"
 */
export function formatNumber(value: number | string, decimals: number = 2): string {
  if (value === '' || value === null || value === undefined) return '0'

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '0'

  // Split into integer and decimal parts
  const parts = numValue.toFixed(decimals).split('.')

  // Add thousand separators to integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  // Join with comma as decimal separator
  return parts.join(',')
}
