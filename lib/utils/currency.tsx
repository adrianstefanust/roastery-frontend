import { DollarSign, Euro, PoundSterling, CircleDollarSign } from 'lucide-react'

export const getCurrencySymbol = (currencyCode: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
    IDR: 'Rp',
    SGD: 'S$',
  }
  return symbols[currencyCode] || currencyCode
}

export const getCurrencyIcon = (currencyCode: string) => {
  switch (currencyCode) {
    case 'EUR':
      return Euro
    case 'GBP':
      return PoundSterling
    case 'USD':
    case 'AUD':
    case 'CAD':
    case 'SGD':
      return DollarSign
    default:
      return CircleDollarSign
  }
}

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode)

  // For currencies that don't have decimal places (like JPY)
  const decimals = ['JPY', 'KRW'].includes(currencyCode) ? 0 : 2

  // Format with proper thousands separator
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return `${symbol}${formattedAmount}`
}
