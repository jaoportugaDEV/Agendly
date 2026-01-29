import { z } from 'zod'

// Validação de horário no formato HH:MM
const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
  message: 'Horário deve estar no formato HH:MM (ex: 09:00)',
})

// Schema para atualizar horários padrão
export const updateDefaultHoursSchema = z
  .object({
    openingTime: timeSchema,
    closingTime: timeSchema,
  })
  .refine(
    (data) => {
      const [openHour, openMin] = data.openingTime.split(':').map(Number)
      const [closeHour, closeMin] = data.closingTime.split(':').map(Number)
      const openMinutes = openHour * 60 + openMin
      const closeMinutes = closeHour * 60 + closeMin
      return closeMinutes > openMinutes
    },
    {
      message: 'Horário de fechamento deve ser posterior ao de abertura',
    }
  )

// Schema para atualizar horário de um dia específico
export const updateDayHoursSchema = z
  .object({
    dayOfWeek: z.enum([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]),
    openingTime: timeSchema,
    closingTime: timeSchema,
    isClosed: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Se está fechado, não precisa validar horários
      if (data.isClosed) return true

      const [openHour, openMin] = data.openingTime.split(':').map(Number)
      const [closeHour, closeMin] = data.closingTime.split(':').map(Number)
      const openMinutes = openHour * 60 + openMin
      const closeMinutes = closeHour * 60 + closeMin
      return closeMinutes > openMinutes
    },
    {
      message: 'Horário de fechamento deve ser posterior ao de abertura',
    }
  )

// Schema para atualizar múltiplos dias
export const bulkUpdateDayHoursSchema = z.array(
  z.object({
    dayOfWeek: z.enum([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]),
    openingTime: timeSchema,
    closingTime: timeSchema,
    isClosed: z.boolean().default(false),
  })
)

// Schema para toggle de horários customizados
export const toggleCustomHoursSchema = z.object({
  enabled: z.boolean(),
})
