import { z } from 'zod'

// Schema para criar pagamento
export const createPaymentSchema = z.object({
  appointmentId: z.string().uuid('ID de agendamento inválido'),
  paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'transfer', 'other'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }),
  paymentType: z.enum(['cash', 'installment'], {
    errorMap: () => ({ message: 'Tipo de pagamento inválido' })
  }),
  installmentCount: z.number().int().min(2, 'Mínimo 2 parcelas').max(12, 'Máximo 12 parcelas').optional(),
  notes: z.string().optional()
}).refine(
  (data) => {
    // Se é parcelado, installmentCount é obrigatório
    if (data.paymentType === 'installment' && !data.installmentCount) {
      return false
    }
    // Se não é parcelado, installmentCount não deve existir
    if (data.paymentType === 'cash' && data.installmentCount) {
      return false
    }
    return true
  },
  {
    message: 'Número de parcelas é obrigatório para pagamento parcelado',
    path: ['installmentCount']
  }
)

// Schema para confirmar pagamento de parcela
export const confirmInstallmentSchema = z.object({
  installmentId: z.string().uuid('ID de parcela inválido'),
  notes: z.string().optional()
})

// Schema para filtros de relatório de pagamentos
export const paymentFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['all', 'pending', 'paid', 'installment', 'overdue']).optional(),
  paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'transfer', 'other']).optional()
})

// Types inferidos
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type ConfirmInstallmentInput = z.infer<typeof confirmInstallmentSchema>
export type PaymentFilters = z.infer<typeof paymentFiltersSchema>
