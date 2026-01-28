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

export const resetStaffPasswordSchema = z.object({
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>
export type UpdateStaffMemberInput = z.infer<typeof updateStaffMemberSchema>
export type ResetStaffPasswordInput = z.infer<typeof resetStaffPasswordSchema>
