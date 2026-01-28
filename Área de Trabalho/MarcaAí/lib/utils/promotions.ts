/**
 * Utilitários para trabalhar com promoções
 */

export interface Promotion {
  id: string
  name: string
  description?: string
  promotion_type: 'service' | 'package'
  target_id: string
  promotional_price: number
  original_price: number
  discount_percentage: number
  weekdays: number[]
  recurrence_type: 'recurring' | 'date_range'
  start_date?: string
  end_date?: string
  active: boolean
}

/**
 * Formata array de dias da semana para exibição legível
 * @param weekdays Array de números (0=domingo, 1=segunda, ..., 6=sábado)
 * @returns String formatada (ex: "Segundas, Quartas e Sextas")
 */
export function formatWeekdays(weekdays: number[]): string {
  const dayNames = [
    'Domingos',
    'Segundas',
    'Terças',
    'Quartas',
    'Quintas',
    'Sextas',
    'Sábados',
  ]

  if (weekdays.length === 0) return ''
  if (weekdays.length === 1) return dayNames[weekdays[0]]
  if (weekdays.length === 7) return 'Todos os dias'

  // Ordenar dias
  const sorted = [...weekdays].sort((a, b) => a - b)
  const names = sorted.map((day) => dayNames[day])

  if (names.length === 2) {
    return `${names[0]} e ${names[1]}`
  }

  const last = names.pop()
  return `${names.join(', ')} e ${last}`
}

/**
 * Retorna abreviação do dia da semana
 * @param day Número do dia (0=domingo, 1=segunda, ..., 6=sábado)
 * @returns Letra do dia (D, S, T, Q, Q, S, S)
 */
export function getWeekdayAbbrev(day: number): string {
  const abbrevs = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
  return abbrevs[day] || ''
}

/**
 * Calcula o desconto percentual
 * @param originalPrice Preço original
 * @param promotionalPrice Preço promocional
 * @returns Percentual de desconto arredondado
 */
export function calculateDiscount(
  originalPrice: number,
  promotionalPrice: number
): number {
  if (originalPrice <= 0) return 0
  const discount = ((originalPrice - promotionalPrice) / originalPrice) * 100
  return Math.round(discount)
}

/**
 * Valida se uma data é válida para uma promoção
 * @param date Data a validar
 * @param promotion Dados da promoção
 * @returns true se a data é válida para a promoção
 */
export function isDateValidForPromotion(
  date: Date,
  promotion: Promotion
): boolean {
  // Verificar dia da semana
  const dayOfWeek = date.getDay()
  if (!promotion.weekdays.includes(dayOfWeek)) {
    return false
  }

  // Se for recorrente, apenas o dia da semana importa
  if (promotion.recurrence_type === 'recurring') {
    return true
  }

  // Se for período específico, verificar datas
  if (
    promotion.recurrence_type === 'date_range' &&
    promotion.start_date &&
    promotion.end_date
  ) {
    const dateOnly = new Date(date.toISOString().split('T')[0])
    const start = new Date(promotion.start_date)
    const end = new Date(promotion.end_date)

    return dateOnly >= start && dateOnly <= end
  }

  return false
}

/**
 * Retorna a próxima data válida para uma promoção a partir de uma data inicial
 * @param startDate Data inicial para buscar
 * @param promotion Dados da promoção
 * @param maxDays Máximo de dias para buscar (padrão: 90)
 * @returns Próxima data válida ou null se não encontrar
 */
export function getNextValidDate(
  startDate: Date,
  promotion: Promotion,
  maxDays: number = 90
): Date | null {
  let currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)

  for (let i = 0; i < maxDays; i++) {
    if (isDateValidForPromotion(currentDate, promotion)) {
      return currentDate
    }
    currentDate = new Date(currentDate)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return null
}

/**
 * Retorna todas as datas válidas em um intervalo
 * @param startDate Data inicial
 * @param endDate Data final
 * @param promotion Dados da promoção
 * @returns Array de datas válidas
 */
export function getValidDatesInRange(
  startDate: Date,
  endDate: Date,
  promotion: Promotion
): Date[] {
  const validDates: Date[] = []
  let currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  while (currentDate <= end) {
    if (isDateValidForPromotion(currentDate, promotion)) {
      validDates.push(new Date(currentDate))
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return validDates
}

/**
 * Formata descrição do período da promoção
 * @param promotion Dados da promoção
 * @returns String descritiva (ex: "Sempre às segundas" ou "De 01/02 a 28/02")
 */
export function formatPromotionPeriod(promotion: Promotion): string {
  if (promotion.recurrence_type === 'recurring') {
    return `Sempre ${formatWeekdays(promotion.weekdays).toLowerCase()}`
  }

  if (promotion.start_date && promotion.end_date) {
    const start = new Date(promotion.start_date).toLocaleDateString('pt-BR')
    const end = new Date(promotion.end_date).toLocaleDateString('pt-BR')
    return `De ${start} a ${end}`
  }

  return 'Período não definido'
}

/**
 * Verifica se uma promoção está expirada (apenas para date_range)
 * @param promotion Dados da promoção
 * @returns true se a promoção está expirada
 */
export function isPromotionExpired(promotion: Promotion): boolean {
  if (promotion.recurrence_type !== 'date_range' || !promotion.end_date) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const endDate = new Date(promotion.end_date)
  endDate.setHours(23, 59, 59, 999)

  return today > endDate
}

/**
 * Verifica se uma promoção ainda não começou (apenas para date_range)
 * @param promotion Dados da promoção
 * @returns true se a promoção ainda não começou
 */
export function isPromotionNotStarted(promotion: Promotion): boolean {
  if (promotion.recurrence_type !== 'date_range' || !promotion.start_date) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const startDate = new Date(promotion.start_date)
  startDate.setHours(0, 0, 0, 0)

  return today < startDate
}

/**
 * Retorna status descritivo da promoção
 * @param promotion Dados da promoção
 * @returns Status descritivo
 */
export function getPromotionStatus(promotion: Promotion): {
  status: 'active' | 'expired' | 'scheduled' | 'inactive'
  label: string
} {
  if (!promotion.active) {
    return { status: 'inactive', label: 'Inativa' }
  }

  if (isPromotionExpired(promotion)) {
    return { status: 'expired', label: 'Expirada' }
  }

  if (isPromotionNotStarted(promotion)) {
    return { status: 'scheduled', label: 'Agendada' }
  }

  return { status: 'active', label: 'Ativa' }
}
