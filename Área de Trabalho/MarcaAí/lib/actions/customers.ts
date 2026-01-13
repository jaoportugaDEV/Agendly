// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { createCustomerSchema, updateCustomerSchema } from '@/lib/validations/appointment'
import { revalidatePath } from 'next/cache'

export async function getCustomers(businessId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar clientes:', error)
    return { success: false, error: 'Erro ao buscar clientes' }
  }

  return { success: true, data }
}

export async function getCustomerById(customerId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Erro ao buscar cliente:', error)
    return { success: false, error: 'Erro ao buscar cliente' }
  }

  return { success: true, data }
}

export async function searchCustomers(businessId: string, query: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10)

  if (error) {
    console.error('Erro ao buscar clientes:', error)
    return { success: false, error: 'Erro ao buscar clientes' }
  }

  return { success: true, data }
}

export async function createCustomer(businessId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = createCustomerSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const { name, email, phone, notes } = validation.data

  // Verificar se já existe um cliente com esse telefone
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .is('deleted_at', null)
    .single()

  if (existing) {
    return { success: false, error: 'Já existe um cliente com este telefone' }
  }

  // Criar cliente
  const { data, error } = await supabase
    .from('customers')
    .insert({
      business_id: businessId,
      name,
      email,
      phone,
      notes,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar cliente:', error)
    return { success: false, error: 'Erro ao criar cliente' }
  }

  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function updateCustomer(customerId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = updateCustomerSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const updateData: Record<string, unknown> = {}

  if (validation.data.name !== undefined) {
    updateData.name = validation.data.name
  }
  if (validation.data.email !== undefined) {
    updateData.email = validation.data.email
  }
  if (validation.data.phone !== undefined) {
    updateData.phone = validation.data.phone
  }
  if (validation.data.notes !== undefined) {
    updateData.notes = validation.data.notes
  }

  // Atualizar cliente
  const { data, error } = await supabase
    .from('customers')
    .update(updateData)
    .eq('id', customerId)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar cliente:', error)
    return { success: false, error: 'Erro ao atualizar cliente' }
  }

  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function deleteCustomer(customerId: string) {
  const supabase = await createClient()

  // Soft delete
  const { error } = await supabase
    .from('customers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', customerId)

  if (error) {
    console.error('Erro ao deletar cliente:', error)
    return { success: false, error: 'Erro ao deletar cliente' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
