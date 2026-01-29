import { z } from 'zod'

export const publicBookingSchema = z.object({
  serviceId: z.string().uuid('ID do serviço inválido'),
  staffId: z.string().uuid('ID do profissional inválido'),
  startTime: z.string().datetime('Data e hora inválidas'),
  customer: z.object({
    name: z
      .string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(255, 'Nome muito longo'),
    email: z
      .string()
      .email('Email inválido')
      .optional()
      .or(z.literal('')),
    phone: z
      .string()
      .min(9, 'Telefone inválido')
      .max(20, 'Telefone muito longo'),
    notes: z
      .string()
      .max(500, 'Observações muito longas (máximo 500 caracteres)')
      .optional()
      .or(z.literal('')),
  }),
})

export type PublicBookingInput = z.infer<typeof publicBookingSchema>
