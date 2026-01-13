import { CountryCode, Currency, COUNTRIES } from '@/types/shared'

/**
 * Get country configuration by code
 */
export function getCountryConfig(code: CountryCode) {
  return COUNTRIES[code]
}

/**
 * Format currency value based on currency code
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const locale = currency === 'EUR' ? 'pt-PT' : 'pt-BR'
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format date/time with timezone
 */
export function formatDateTime(
  date: Date | string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }
  
  return new Intl.DateTimeFormat('pt', {
    ...defaultOptions,
    ...options,
  }).format(dateObj)
}

/**
 * Format date only (no time)
 */
export function formatDate(
  date: Date | string,
  timezone: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('pt', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  }).format(dateObj)
}

/**
 * Format time only (no date)
 */
export function formatTime(
  date: Date | string,
  timezone: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('pt', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(dateObj)
}

/**
 * Detect country from browser/IP (client-side detection)
 * Falls back to PT if detection fails
 */
export async function detectCountryFromBrowser(): Promise<CountryCode> {
  try {
    // Try to get timezone from browser
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Simple timezone to country mapping
    if (timezone.includes('America/Sao_Paulo') || timezone.includes('America/Fortaleza')) {
      return 'BR'
    }
    
    if (timezone.includes('Europe/Lisbon') || timezone.includes('Atlantic/Azores')) {
      return 'PT'
    }
    
    // Try to detect via browser language
    const language = navigator.language || navigator.languages?.[0]
    if (language?.includes('pt-BR')) {
      return 'BR'
    }
    
    // Default to Portugal
    return 'PT'
  } catch (error) {
    console.error('Error detecting country:', error)
    return 'PT'
  }
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    EUR: '€',
    BRL: 'R$',
  }
  return symbols[currency]
}

/**
 * Convert time string (HH:MM) to minutes
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Get current date in business timezone
 */
export function getCurrentDateInTimezone(timezone: string): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: timezone })
  )
}

/**
 * Check if date is in the past
 */
export function isDateInPast(date: Date | string, timezone: string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = getCurrentDateInTimezone(timezone)
  return dateObj < now
}
