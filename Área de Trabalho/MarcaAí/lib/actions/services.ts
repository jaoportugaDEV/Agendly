// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceSchema, updateServiceSchema } from '@/lib/validations/service'
import { revalidatePath } from 'next/cache'

export async function getServices(businessId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar serviços:', error)
    return { success: false, error: 'Erro ao buscar serviços' }
  }

  return { success: true, data }
}

export async function getServiceById(serviceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Erro ao buscar serviço:', error)
    return { success: false, error: 'Erro ao buscar serviço' }
  }

  return { success: true, data }
}

export async function createService(businessId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = createServiceSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const { name, description, durationMinutes, price } = validation.data

  // Buscar moeda do negócio
  const { data: business } = await supabase
    .from('businesses')
    .select('currency')
    .eq('id', businessId)
    .single()

  if (!business) {
    return { success: false, error: 'Negócio não encontrado' }
  }

  // Criar serviço
  const { data, error } = await supabase
    .from('services')
    .insert({
      business_id: businessId,
      name,
      description,
      duration_minutes: durationMinutes,
      price,
      currency: business.currency,
      active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar serviço:', error)
    return { success: false, error: 'Erro ao criar serviço' }
  }

  revalidatePath('/dashboard/services')
  return { success: true, data }
}

export async function updateService(serviceId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = updateServiceSchema.safeParse(input)
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
  if (validation.data.description !== undefined) {
    updateData.description = validation.data.description
  }
  if (validation.data.durationMinutes !== undefined) {
    updateData.duration_minutes = validation.data.durationMinutes
  }
  if (validation.data.price !== undefined) {
    updateData.price = validation.data.price
  }
  if (validation.data.active !== undefined) {
    updateData.active = validation.data.active
  }

  // Atualizar serviço
  const { data, error } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', serviceId)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar serviço:', error)
    return { success: false, error: 'Erro ao atualizar serviço' }
  }

  revalidatePath('/dashboard/services')
  return { success: true, data }
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient()

  // Soft delete
  const { error } = await supabase
    .from('services')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', serviceId)

  if (error) {
    console.error('Erro ao deletar serviço:', error)
    return { success: false, error: 'Erro ao deletar serviço' }
  }

  revalidatePath('/dashboard/services')
  return { success: true }
}

export async function toggleServiceStatus(serviceId: string, active: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('services')
    .update({ active })
    .eq('id', serviceId)

  if (error) {
    console.error('Erro ao alterar status do serviço:', error)
    return { success: false, error: 'Erro ao alterar status do serviço' }
  }

  revalidatePath('/dashboard/services')
  return { success: true }
}
