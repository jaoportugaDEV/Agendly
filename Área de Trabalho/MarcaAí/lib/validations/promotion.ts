import { z } from 'zod'

export const createPromotionSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  description: z.string().optional(),
  promotionType: z.enum(['service', 'package'], {
    required_error: 'Tipo de promoção é obrigatório',
  }),
  targetId: z.string().uuid('ID do serviço/pacote inválido'),
  promotionalPrice: z
    .number()
    .positive('Preço promocional deve ser maior que zero')
    .max(999999.99, 'Preço muito alto'),
  originalPrice: z
    .number()
    .positive('Preço original deve ser maior que zero'),
  weekdays: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'Selecione pelo menos um dia da semana')
    .refine(
      (days) => {
        const unique = new Set(days)
        return unique.size === days.length
      },
      { message: 'Dias da semana duplicados' }
    ),
  recurrenceType: z.enum(['recurring', 'date_range'], {
    required_error: 'Tipo de recorrência é obrigatório',
  }),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  active: z.boolean().default(true),
})
  .refine(
    (data) => data.promotionalPrice < data.originalPrice,
    {
      message: 'Preço promocional deve ser menor que o preço original',
      path: ['promotionalPrice'],
    }
  )
  .refine(
    (data) => {
      if (data.recurrenceType === 'date_range') {
        return data.startDate && data.endDate
      }
      return true
    },
    {
      message: 'Datas de início e fim são obrigatórias para período específico',
      path: ['startDate'],
    }
  )
  .refine(
    (data) => {
      if (data.recurrenceType === 'date_range' && data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate)
      }
      return true
    },
    {
      message: 'Data de fim deve ser posterior à data de início',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      if (data.recurrenceType === 'recurring') {
        return !data.startDate && !data.endDate
      }
      return true
    },
    {
      message: 'Promoções recorrentes não devem ter datas de início/fim',
      path: ['recurrenceType'],
    }
  )

export const updatePromotionSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .optional(),
  description: z.string().optional(),
  promotionalPrice: z
    .number()
    .positive('Preço promocional deve ser maior que zero')
    .max(999999.99, 'Preço muito alto')
    .optional(),
  originalPrice: z
    .number()
    .positive('Preço original deve ser maior que zero')
    .optional(),
  weekdays: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'Selecione pelo menos um dia da semana')
    .refine(
      (days) => {
        const unique = new Set(days)
        return unique.size === days.length
      },
      { message: 'Dias da semana duplicados' }
    )
    .optional(),
  recurrenceType: z.enum(['recurring', 'date_range']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  active: z.boolean().optional(),
})
  .refine(
    (data) => {
      if (data.promotionalPrice !== undefined && data.originalPrice !== undefined) {
        return data.promotionalPrice < data.originalPrice
      }
      return true
    },
    {
      message: 'Preço promocional deve ser menor que o preço original',
      path: ['promotionalPrice'],
    }
  )
  .refine(
    (data) => {
      if (data.recurrenceType === 'date_range') {
        return data.startDate && data.endDate
      }
      return true
    },
    {
      message: 'Datas de início e fim são obrigatórias para período específico',
      path: ['startDate'],
    }
  )
  .refine(
    (data) => {
      if (data.recurrenceType === 'date_range' && data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate)
      }
      return true
    },
    {
      message: 'Data de fim deve ser posterior à data de início',
      path: ['endDate'],
    }
  )

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>
