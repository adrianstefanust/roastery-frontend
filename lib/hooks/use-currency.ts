import { useAuthStore } from '@/lib/stores/auth-store'
import { getCurrencyIcon } from '@/lib/utils/currency'

export const useCurrency = () => {
  const { user } = useAuthStore()
  const currencyCode = user?.currency || 'USD'

  return {
    currencyCode,
    symbol: currencyCode, // Use currency code instead of symbol
    icon: getCurrencyIcon(currencyCode),
    format: (amount: number) => `${currencyCode} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  }
}
