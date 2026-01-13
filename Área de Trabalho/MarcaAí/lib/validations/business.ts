import { z } from 'zod'

export const createBusinessSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome da empresa é obrigatório')
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  countryCode: z.enum(['PT', 'BR'], {
    required_error: 'País é obrigatório',
  }),
  businessType: z
    .string()
    .min(1, 'Tipo de negócio é obrigatório'),
  description: z
    .string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  phone: z
    .string()
    .optional(),
  email: z
    .string()
    .email('Email inválido')
    .optional(),
  address: z
    .string()
    .optional(),
  city: z
    .string()
    .optional(),
  state: z
    .string()
    .optional(),
  postalCode: z
    .string()
    .optional(),
  website: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
})

export const updateBusinessSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .optional(),
  description: z
    .string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  businessType: z
    .string()
    .optional(),
  phone: z
    .string()
    .optional(),
  email: z
    .string()
    .email('Email inválido')
    .optional(),
  address: z
    .string()
    .optional(),
  city: z
    .string()
    .optional(),
  state: z
    .string()
    .optional(),
  postalCode: z
    .string()
    .optional(),
  website: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  logoUrl: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
})

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  role: z.enum(['admin', 'staff'], {
    required_error: 'Função é obrigatória',
  }),
})

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
