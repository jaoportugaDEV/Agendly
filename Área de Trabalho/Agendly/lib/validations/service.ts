import { z } from 'zod'

export const createServiceSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome do serviço é obrigatório')
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  description: z
    .string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  durationMinutes: z
    .number()
    .min(15, 'Duração mínima é 15 minutos')
    .max(480, 'Duração máxima é 480 minutos (8 horas)'),
  price: z
    .number()
    .min(0, 'Preço deve ser maior ou igual a zero')
    .max(999999.99, 'Preço muito alto'),
})

export const updateServiceSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .optional(),
  description: z
    .string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  durationMinutes: z
    .number()
    .min(15, 'Duração mínima é 15 minutos')
    .max(480, 'Duração máxima é 480 minutos (8 horas)')
    .optional(),
  price: z
    .number()
    .min(0, 'Preço deve ser maior ou igual a zero')
    .max(999999.99, 'Preço muito alto')
    .optional(),
  active: z
    .boolean()
    .optional(),
})

export const createStaffScheduleSchema = z.object({
  staffId: z
    .string()
    .uuid('ID do funcionário inválido'),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora de início inválida (formato: HH:MM)'),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora de término inválida (formato: HH:MM)'),
}).refine((data) => data.startTime < data.endTime, {
  message: 'Hora de término deve ser maior que hora de início',
  path: ['endTime'],
})

export const updateStaffScheduleSchema = z.object({
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora de início inválida (formato: HH:MM)')
    .optional(),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora de término inválida (formato: HH:MM)')
    .optional(),
  active: z
    .boolean()
    .optional(),
})

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
export type CreateStaffScheduleInput = z.infer<typeof createStaffScheduleSchema>
export type UpdateStaffScheduleInput = z.infer<typeof updateStaffScheduleSchema>
