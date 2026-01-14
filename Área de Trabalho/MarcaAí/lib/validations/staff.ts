import { z } from 'zod'

export const inviteStaffSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  fullName: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
  role: z.enum(['admin', 'staff']),
})

export const updateStaffMemberSchema = z.object({
  role: z.enum(['admin', 'staff']).optional(),
  active: z.boolean().optional(),
})

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>
export type UpdateStaffMemberInput = z.infer<typeof updateStaffMemberSchema>
