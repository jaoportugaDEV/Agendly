'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createExpenseSchema,
  updateExpenseSchema,
  markExpenseAsPaidSchema,
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  expenseFiltersSchema
} from '@/lib/validations/expense'
import { revalidatePath } from 'next/cache'

/**
 * Cria uma nova despesa
 */
export async function createExpense(businessId: string, input: unknown) {
  try {
    const validation = createExpenseSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Dados inválidos'
      }
    }

    const data = validation.data
    const supabase = await createClient()

    // Verificar autenticação e permissão de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { success: false, error: 'Apenas administradores podem criar despesas' }
    }

    // Buscar moeda da empresa
    const { data: business } = await supabase
      .from('businesses')
      .select('country_code')
      .eq('id', businessId)
      .single()

    const currency = business?.country_code === 'PT' ? 'EUR' : 'BRL'

    // Criar despesa
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        business_id: businessId,
        expense_type: data.expenseType,
        category_id: data.categoryId,
        amount: data.amount,
        currency,
        frequency: data.frequency,
        expense_date: data.expenseDate,
        due_date: data.dueDate,
        description: data.description,
        notes: data.notes,
        is_recurring: data.isRecurring,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar despesa:', error)
      return { success: false, error: 'Erro ao criar despesa' }
    }

    revalidatePath('/', 'layout')
    return { success: true, data: expense, message: 'Despesa criada com sucesso' }
  } catch (error) {
    console.error('Erro ao criar despesa:', error)
    return { success: false, error: 'Erro inesperado ao criar despesa' }
  }
}

/**
 * Busca despesas com filtros
 */
export async function getExpenses(businessId: string, filters?: unknown) {
  try {
    const validation = expenseFiltersSchema.safeParse(filters || {})
    const filterData = validation.success ? validation.data : {}

    const supabase = await createClient()

    let query = supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories(name, color)
      `)
      .eq('business_id', businessId)
      .order('expense_date', { ascending: false })

    // Aplicar filtros
    if (filterData.startDate) {
      query = query.gte('expense_date', filterData.startDate)
    }
    if (filterData.endDate) {
      query = query.lte('expense_date', filterData.endDate)
    }
    if (filterData.expenseType) {
      query = query.eq('expense_type', filterData.expenseType)
    }
    if (filterData.isPaid !== undefined) {
      query = query.eq('is_paid', filterData.isPaid)
    }
    if (filterData.categoryId) {
      query = query.eq('category_id', filterData.categoryId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar despesas:', error)
      return { success: false, error: 'Erro ao buscar despesas' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar despesas:', error)
    return { success: false, error: 'Erro ao buscar despesas' }
  }
}

/**
 * Atualiza uma despesa
 */
export async function updateExpense(input: unknown) {
  try {
    const validation = updateExpenseSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Dados inválidos'
      }
    }

    const { id, ...data } = validation.data
    const supabase = await createClient()

    const { error } = await supabase
      .from('expenses')
      .update(data)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar despesa:', error)
      return { success: false, error: 'Erro ao atualizar despesa' }
    }

    revalidatePath('/', 'layout')
    return { success: true, message: 'Despesa atualizada com sucesso' }
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error)
    return { success: false, error: 'Erro inesperado ao atualizar despesa' }
  }
}

/**
 * Marca uma despesa como paga
 */
export async function markExpenseAsPaid(input: unknown) {
  try {
    const validation = markExpenseAsPaidSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Dados inválidos'
      }
    }

    const data = validation.data
    const supabase = await createClient()

    const { error } = await supabase
      .from('expenses')
      .update({
        is_paid: true,
        paid_at: data.paidAt || new Date().toISOString()
      })
      .eq('id', data.expenseId)

    if (error) {
      console.error('Erro ao marcar despesa como paga:', error)
      return { success: false, error: 'Erro ao marcar despesa como paga' }
    }

    revalidatePath('/', 'layout')
    return { success: true, message: 'Despesa marcada como paga' }
  } catch (error) {
    console.error('Erro ao marcar despesa como paga:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

/**
 * Deleta uma despesa
 */
export async function deleteExpense(expenseId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)

    if (error) {
      console.error('Erro ao deletar despesa:', error)
      return { success: false, error: 'Erro ao deletar despesa' }
    }

    revalidatePath('/', 'layout')
    return { success: true, message: 'Despesa deletada com sucesso' }
  } catch (error) {
    console.error('Erro ao deletar despesa:', error)
    return { success: false, error: 'Erro inesperado ao deletar despesa' }
  }
}

/**
 * Cria uma categoria de despesa customizada
 */
export async function createExpenseCategory(businessId: string, input: unknown) {
  try {
    const validation = createExpenseCategorySchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Dados inválidos'
      }
    }

    const data = validation.data
    const supabase = await createClient()

    // Verificar autenticação e permissão
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { success: false, error: 'Apenas administradores podem criar categorias' }
    }

    // Criar categoria
    const { data: category, error } = await supabase
      .from('expense_categories')
      .insert({
        business_id: businessId,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar categoria:', error)
      return { success: false, error: 'Erro ao criar categoria' }
    }

    revalidatePath('/', 'layout')
    return { success: true, data: category, message: 'Categoria criada com sucesso' }
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return { success: false, error: 'Erro inesperado ao criar categoria' }
  }
}

/**
 * Busca categorias de despesa
 */
export async function getExpenseCategories(businessId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      return { success: false, error: 'Erro ao buscar categorias' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return { success: false, error: 'Erro ao buscar categorias' }
  }
}

/**
 * Atualiza uma categoria de despesa
 */
export async function updateExpenseCategory(input: unknown) {
  try {
    const validation = updateExpenseCategorySchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Dados inválidos'
      }
    }

    const { id, ...data } = validation.data
    const supabase = await createClient()

    const { error } = await supabase
      .from('expense_categories')
      .update(data)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar categoria:', error)
      return { success: false, error: 'Erro ao atualizar categoria' }
    }

    revalidatePath('/', 'layout')
    return { success: true, message: 'Categoria atualizada com sucesso' }
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    return { success: false, error: 'Erro inesperado ao atualizar categoria' }
  }
}

/**
 * Deleta uma categoria de despesa
 */
export async function deleteExpenseCategory(categoryId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Erro ao deletar categoria:', error)
      return { success: false, error: 'Erro ao deletar categoria' }
    }

    revalidatePath('/', 'layout')
    return { success: true, message: 'Categoria deletada com sucesso' }
  } catch (error) {
    console.error('Erro ao deletar categoria:', error)
    return { success: false, error: 'Erro inesperado ao deletar categoria' }
  }
}

/**
 * Busca estatísticas de despesas
 */
export async function getExpensesStats(businessId: string, startDate: string, endDate: string) {
  try {
    const supabase = await createClient()

    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, is_paid, expense_type')
      .eq('business_id', businessId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)

    const totalExpenses = expenses
      ?.filter(e => e.is_paid)
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0

    const pendingExpenses = expenses
      ?.filter(e => !e.is_paid)
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0

    return {
      success: true,
      data: {
        totalExpenses,
        pendingExpenses,
        count: expenses?.length || 0
      }
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas de despesas:', error)
    return { success: false, error: 'Erro ao buscar estatísticas' }
  }
}
