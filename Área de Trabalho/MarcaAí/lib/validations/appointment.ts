import { z } from 'zod'

export const createAppointmentSchema = z.object({
  staffId: z
    .string()
    .uuid('ID do funcionário inválido'),
  customerId: z
    .string()
    .uuid('ID do cliente inválido'),
  serviceId: z
    .string()
    .uuid('ID do serviço inválido'),
  startTime: z
    .string()
    .datetime('Data/hora de início inválida'),
  notes: z
    .string()
    .max(1000, 'Notas devem ter no máximo 1000 caracteres')
    .optional(),
})

export const updateAppointmentSchema = z.object({
  staffId: z
    .string()
    .uuid('ID do funcionário inválido')
    .optional(),
  customerId: z
    .string()
    .uuid('ID do cliente inválido')
    .optional(),
  serviceId: z
    .string()
    .uuid('ID do serviço inválido')
    .optional(),
  startTime: z
    .string()
    .datetime('Data/hora de início inválida')
    .optional(),
  status: z
    .enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notas devem ter no máximo 1000 caracteres')
    .optional(),
})

export const createCustomerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  email: z
    .string()
    .email('Email inválido')
    .optional(),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^[0-9+()\s-]+$/, 'Telefone inválido'),
  notes: z
    .string()
    .max(1000, 'Notas devem ter no máximo 1000 caracteres')
    .optional(),
})

export const updateCustomerSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .optional(),
  email: z
    .string()
    .email('Email inválido')
    .optional(),
  phone: z
    .string()
    .regex(/^[0-9+()\s-]+$/, 'Telefone inválido')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notas devem ter no máximo 1000 caracteres')
    .optional(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
