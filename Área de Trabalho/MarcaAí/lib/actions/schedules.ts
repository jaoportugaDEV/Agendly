// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createStaffScheduleSchema,
  updateStaffScheduleSchema,
} from '@/lib/validations/service'
import { revalidatePath } from 'next/cache'

export async function getStaffSchedules(businessId: string, staffId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('staff_schedules')
    .select('*')
    .eq('business_id', businessId)
    .eq('active', true)
    .order('day_of_week', { ascending: true })

  if (staffId) {
    query = query.eq('staff_id', staffId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar horários:', error)
    return { success: false, error: 'Erro ao buscar horários' }
  }

  return { success: true, data }
}

export async function createStaffSchedule(businessId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = createStaffScheduleSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const { staffId, dayOfWeek, startTime, endTime } = validation.data

  // Verificar se já existe um horário para esse dia e funcionário
  const { data: existing } = await supabase
    .from('staff_schedules')
    .select('id')
    .eq('business_id', businessId)
    .eq('staff_id', staffId)
    .eq('day_of_week', dayOfWeek)
    .eq('active', true)
    .single()

  if (existing) {
    return {
      success: false,
      error: 'Já existe um horário definido para este dia',
    }
  }

  // Criar horário
  const { data, error } = await supabase
    .from('staff_schedules')
    .insert({
      business_id: businessId,
      staff_id: staffId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar horário:', error)
    return { success: false, error: 'Erro ao criar horário' }
  }

  revalidatePath(`/dashboard/${businessId}/equipe`)
  return { success: true, data }
}

export async function updateStaffSchedule(scheduleId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = updateStaffScheduleSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const updateData: Record<string, unknown> = {}

  if (validation.data.startTime !== undefined) {
    updateData.start_time = validation.data.startTime
  }
  if (validation.data.endTime !== undefined) {
    updateData.end_time = validation.data.endTime
  }
  if (validation.data.active !== undefined) {
    updateData.active = validation.data.active
  }

  // Atualizar horário
  const { data, error } = await supabase
    .from('staff_schedules')
    .update(updateData)
    .eq('id', scheduleId)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar horário:', error)
    return { success: false, error: 'Erro ao atualizar horário' }
  }

  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function deleteStaffSchedule(scheduleId: string) {
  const supabase = await createClient()

  // Soft delete
  const { error } = await supabase
    .from('staff_schedules')
    .update({ active: false })
    .eq('id', scheduleId)

  if (error) {
    console.error('Erro ao deletar horário:', error)
    return { success: false, error: 'Erro ao deletar horário' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function bulkCreateStaffSchedules(
  businessId: string,
  staffId: string,
  schedules: Array<{
    dayOfWeek: string
    startTime: string
    endTime: string
  }>
) {
  const supabase = await createClient()

  // Validar todos os horários
  const validatedSchedules = []
  for (const schedule of schedules) {
    const validation = createStaffScheduleSchema.safeParse({
      staffId,
      ...schedule,
    })
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Dados inválidos',
      }
    }
    validatedSchedules.push(validation.data)
  }

  // Deletar horários existentes (soft delete)
  await supabase
    .from('staff_schedules')
    .update({ active: false })
    .eq('business_id', businessId)
    .eq('staff_id', staffId)

  // Criar novos horários
  const { data, error } = await supabase
    .from('staff_schedules')
    .insert(
      validatedSchedules.map((s) => ({
        business_id: businessId,
        staff_id: s.staffId,
        day_of_week: s.dayOfWeek,
        start_time: s.startTime,
        end_time: s.endTime,
        active: true,
      }))
    )
    .select()

  if (error) {
    console.error('Erro ao criar horários:', error)
    return { success: false, error: 'Erro ao criar horários' }
  }

  revalidatePath(`/dashboard/${businessId}/equipe`)
  return { success: true, data }
}
