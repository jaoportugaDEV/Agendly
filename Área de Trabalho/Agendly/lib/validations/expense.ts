import { z } from 'zod'

// Schema base (sem refine) para reutilização
const baseExpenseSchema = z.object({
  expenseType: z.enum([
    'utilities',
    'rent',
    'salary',
    'products',
    'maintenance',
    'marketing',
    'taxes',
    'insurance',
    'custom'
  ], {
    errorMap: () => ({ message: 'Tipo de despesa inválido' })
  }),
  categoryId: z.string().uuid('ID de categoria inválido').optional(),
  amount: z.number().positive('Valor deve ser maior que zero').max(999999.99, 'Valor muito alto'),
  description: z.string().min(3, 'Descrição muito curta').max(255, 'Descrição muito longa'),
  expenseDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data de vencimento inválida').optional(),
  frequency: z.enum(['once', 'monthly', 'yearly']).default('once'),
  isRecurring: z.boolean().default(false),
  notes: z.string().optional()
})

// Schema para criar despesa (com validação custom)
export const createExpenseSchema = baseExpenseSchema.refine(
  (data) => {
    // Se tipo é custom, categoryId é obrigatório
    if (data.expenseType === 'custom' && !data.categoryId) {
      return false
    }
    return true
  },
  {
    message: 'Categoria é obrigatória para despesas customizadas',
    path: ['categoryId']
  }
)

// Schema para atualizar despesa (usa o base sem refine)
export const updateExpenseSchema = baseExpenseSchema.partial().extend({
  id: z.string().uuid()
})

// Schema para marcar como paga
export const markExpenseAsPaidSchema = z.object({
  expenseId: z.string().uuid('ID de despesa inválido'),
  paidAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data de pagamento inválida').optional()
})

// Schema base de categoria (para reutilização)
const baseCategorySchema = z.object({
  name: z.string().min(3, 'Nome muito curto').max(50, 'Nome muito longo'),
  description: z.string().max(255, 'Descrição muito longa').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor em formato HEX inválido').default('#6B7280'),
  icon: z.string().max(50).optional()
})

// Schema para criar categoria de despesa
export const createExpenseCategorySchema = baseCategorySchema

// Schema para atualizar categoria
export const updateExpenseCategorySchema = baseCategorySchema.partial().extend({
  id: z.string().uuid()
})

// Schema para filtros de despesas
export const expenseFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  expenseType: z.enum(['utilities', 'rent', 'salary', 'products', 'maintenance', 'marketing', 'taxes', 'insurance', 'custom']).optional(),
  isPaid: z.boolean().optional(),
  categoryId: z.string().uuid().optional()
})

// Types inferidos
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type MarkExpenseAsPaidInput = z.infer<typeof markExpenseAsPaidSchema>
export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>
export type UpdateExpenseCategoryInput = z.infer<typeof updateExpenseCategorySchema>
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>
