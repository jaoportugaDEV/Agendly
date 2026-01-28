// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from './auth'
import { revalidatePath } from 'next/cache'

/**
 * Busca bloqueios ativos de um negócio
 */
export async function getBusinessBlocks(businessId: string, filters?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('schedule_blocks')
      .select(`
        *,
        staff:users(id, full_name),
        service:services(id, name),
        created_by_user:users!schedule_blocks_created_by_fkey(full_name)
      `)
      .eq('business_id', businessId)
      .eq('active', true)
      .order('start_date', { ascending: false })

    if (filters?.startDate) {
      query = query.gte('start_date', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('end_date', filters.endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar bloqueios:', error)
      return { success: false, error: 'Erro ao buscar bloqueios' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar bloqueios:', error)
    return { success: false, error: 'Erro ao buscar bloqueios' }
  }
}

/**
 * Cria um novo bloqueio
 */
export async function createBlock(businessId: string, data: {
  blockType: 'one_time' | 'recurring'
  reason?: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  allDay: boolean
  staffId?: string
  serviceId?: string
  recurrencePattern?: any
}) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Verificar se usuário é admin
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { success: false, error: 'Sem permissão' }
    }

    // Validar datas
    if (new Date(data.endDate) < new Date(data.startDate)) {
      return { success: false, error: 'Data final deve ser maior que data inicial' }
    }

    // Criar bloqueio
    const { error } = await supabase
      .from('schedule_blocks')
      .insert({
        business_id: businessId,
        block_type: data.blockType,
        reason: data.reason,
        start_date: data.startDate,
        end_date: data.endDate,
        start_time: data.startTime,
        end_time: data.endTime,
        all_day: data.allDay,
        staff_id: data.staffId,
        service_id: data.serviceId,
        recurrence_pattern: data.recurrencePattern,
        created_by: user.id,
        active: true
      })

    if (error) {
      console.error('Erro ao criar bloqueio:', error)
      return { success: false, error: 'Erro ao criar bloqueio' }
    }

    revalidatePath(`/${businessId}/bloqueios`)
    return { success: true, message: 'Bloqueio criado com sucesso' }
  } catch (error) {
    console.error('Erro ao criar bloqueio:', error)
    return { success: false, error: 'Erro ao criar bloqueio' }
  }
}

/**
 * Atualiza um bloqueio
 */
export async function updateBlock(blockId: string, data: {
  reason?: string
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
  allDay?: boolean
  active?: boolean
}) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Buscar bloqueio para verificar permissão
    const { data: block } = await supabase
      .from('schedule_blocks')
      .select('business_id')
      .eq('id', blockId)
      .single()

    if (!block) {
      return { success: false, error: 'Bloqueio não encontrado' }
    }

    // Verificar se usuário é admin
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', block.business_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { success: false, error: 'Sem permissão' }
    }

    const updateData: any = {}
    if (data.reason !== undefined) updateData.reason = data.reason
    if (data.startDate !== undefined) updateData.start_date = data.startDate
    if (data.endDate !== undefined) updateData.end_date = data.endDate
    if (data.startTime !== undefined) updateData.start_time = data.startTime
    if (data.endTime !== undefined) updateData.end_time = data.endTime
    if (data.allDay !== undefined) updateData.all_day = data.allDay
    if (data.active !== undefined) updateData.active = data.active

    const { error } = await supabase
      .from('schedule_blocks')
      .update(updateData)
      .eq('id', blockId)

    if (error) {
      return { success: false, error: 'Erro ao atualizar bloqueio' }
    }

    revalidatePath('/bloqueios')
    return { success: true, message: 'Bloqueio atualizado com sucesso' }
  } catch (error) {
    console.error('Erro ao atualizar bloqueio:', error)
    return { success: false, error: 'Erro ao atualizar bloqueio' }
  }
}

/**
 * Deleta (desativa) um bloqueio
 */
export async function deleteBlock(blockId: string) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Buscar bloqueio para verificar permissão
    const { data: block } = await supabase
      .from('schedule_blocks')
      .select('business_id')
      .eq('id', blockId)
      .single()

    if (!block) {
      return { success: false, error: 'Bloqueio não encontrado' }
    }

    // Verificar se usuário é admin
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', block.business_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { success: false, error: 'Sem permissão' }
    }

    // Desativar ao invés de deletar
    const { error } = await supabase
      .from('schedule_blocks')
      .update({ active: false })
      .eq('id', blockId)

    if (error) {
      return { success: false, error: 'Erro ao deletar bloqueio' }
    }

    revalidatePath('/bloqueios')
    return { success: true, message: 'Bloqueio removido com sucesso' }
  } catch (error) {
    console.error('Erro ao deletar bloqueio:', error)
    return { success: false, error: 'Erro ao deletar bloqueio' }
  }
}

/**
 * Busca funcionários ativos de um negócio
 */
export async function getBusinessStaff(businessId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('business_members')
      .select('user_id, users!inner(id, full_name)')
      .eq('business_id', businessId)
      .eq('active', true)

    if (error) {
      return { success: false, error: 'Erro ao buscar funcionários' }
    }

    const staff = data?.map((m: any) => ({
      id: m.users.id,
      name: m.users.full_name
    })) || []

    return { success: true, data: staff }
  } catch (error) {
    return { success: false, error: 'Erro ao buscar funcionários' }
  }
}

/**
 * Busca serviços ativos de um negócio
 */
export async function getBusinessServices(businessId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('services')
      .select('id, name')
      .eq('business_id', businessId)
      .eq('active', true)
      .is('deleted_at', null)
      .order('name')

    if (error) {
      return { success: false, error: 'Erro ao buscar serviços' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: 'Erro ao buscar serviços' }
  }
}
