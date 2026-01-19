'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface FormattedNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number | string
  onChange: (value: number) => void
  decimals?: number
  allowNegative?: boolean
  prefix?: string
  suffix?: string
}

export const FormattedNumberInput = React.forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  ({ value, onChange, decimals = 2, allowNegative = false, prefix, suffix, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    // Format number with thousand separators
    const formatNumber = (num: number | string): string => {
      if (num === '' || num === null || num === undefined) return ''

      const numValue = typeof num === 'string' ? parseFloat(num) : num
      if (isNaN(numValue)) return ''

      // Split into integer and decimal parts
      const parts = numValue.toFixed(decimals).split('.')

      // Add thousand separators to integer part
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')

      return parts.join(',')
    }

    // Parse formatted string back to number
    const parseFormattedNumber = (formatted: string): number => {
      if (!formatted) return 0

      // Remove thousand separators (.) and replace decimal separator (,) with (.)
      const cleaned = formatted.replace(/\./g, '').replace(/,/g, '.')
      const parsed = parseFloat(cleaned)

      return isNaN(parsed) ? 0 : parsed
    }

    // Update display value when prop value changes
    React.useEffect(() => {
      setDisplayValue(formatNumber(value))
    }, [value, decimals])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value

      // Remove prefix and suffix if present
      if (prefix) inputValue = inputValue.replace(prefix, '')
      if (suffix) inputValue = inputValue.replace(suffix, '')

      // Allow only numbers, dots (thousand sep), commas (decimal sep), and minus
      const allowedChars = allowNegative ? /[^0-9.,-]/g : /[^0-9.,]/g
      inputValue = inputValue.replace(allowedChars, '')

      // Prevent multiple decimal separators
      const commaCount = (inputValue.match(/,/g) || []).length
      if (commaCount > 1) return

      setDisplayValue(inputValue)
    }

    const handleBlur = () => {
      const numValue = parseFormattedNumber(displayValue)

      // Validate negative numbers
      if (!allowNegative && numValue < 0) {
        onChange(0)
        setDisplayValue(formatNumber(0))
        return
      }

      onChange(numValue)
      setDisplayValue(formatNumber(numValue))
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Select all on focus for easy editing
      e.target.select()
    }

    const displayText = prefix || suffix
      ? `${prefix || ''}${displayValue}${suffix || ''}`
      : displayValue

    return (
      <Input
        ref={ref}
        type="text"
        value={displayText}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn('text-right', className)}
        {...props}
      />
    )
  }
)

FormattedNumberInput.displayName = 'FormattedNumberInput'
