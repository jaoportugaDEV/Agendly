// Enums and shared types

export type CountryCode = 'PT' | 'BR'

export type Currency = 'EUR' | 'BRL'

export type UserRole = 'admin' | 'staff'

export type AppointmentStatus = 
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'

export type AppointmentSource = 'internal' | 'public'

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'trialing'

export interface CountryConfig {
  code: CountryCode
  name: string
  currency: Currency
  timezone: string
  locale: string
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  PT: {
    code: 'PT',
    name: 'Portugal',
    currency: 'EUR',
    timezone: 'Europe/Lisbon',
    locale: 'pt-PT',
  },
  BR: {
    code: 'BR',
    name: 'Brasil',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    locale: 'pt-BR',
  },
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
  no_show: 'Não compareceu',
}

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  cancelled: 'bg-red-500',
  completed: 'bg-green-500',
  no_show: 'bg-gray-500',
}

// Time slot for availability
export interface TimeSlot {
  time: string // HH:mm format
  datetime: string // ISO datetime
  available: boolean
}

// Public business data
export interface PublicBusinessData {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  timezone: string
  currency: string
  services: PublicServiceData[]
  staff: PublicStaffData[]
}

export interface PublicServiceData {
  id: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  currency: string
  promotion?: PublicPromotionData | null
}

export interface PublicStaffData {
  id: string
  name: string
  avatar_url?: string
}

// Promotion types
export type PromotionType = 'service' | 'package'
export type RecurrenceType = 'recurring' | 'date_range'

export interface Promotion {
  id: string
  business_id: string
  name: string
  description?: string
  promotion_type: PromotionType
  target_id: string
  promotional_price: number
  original_price: number
  discount_percentage: number
  weekdays: number[]
  recurrence_type: RecurrenceType
  start_date?: string
  end_date?: string
  active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface PublicPromotionData {
  id: string
  promotional_price: number
  discount_percentage: number
  weekdays: number[]
  recurrence_type: RecurrenceType
  start_date?: string
  end_date?: string
}
