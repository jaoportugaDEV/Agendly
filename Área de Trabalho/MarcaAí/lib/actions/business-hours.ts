// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import {
  updateDefaultHoursSchema,
  updateDayHoursSchema,
  bulkUpdateDayHoursSchema,
  toggleCustomHoursSchema,
} from '@/lib/validations/business-hours'
import { revalidatePath } from 'next/cache'
import { DEFAULT_START_TIME, DEFAULT_END_TIME } from '@/lib/constants'

export interface BusinessHours {
  defaultOpening: string
  defaultClosing: string
  customHoursEnabled: boolean
  customHours?: Array<{
    dayOfWeek: string
    openingTime: string
    closingTime: string
    isClosed: boolean
  }>
}

/**
 * Buscar horários de funcionamento do estabelecimento
 */
export async function getBusinessHours(
  businessId: string
): Promise<{ success: boolean; data?: BusinessHours; error?: string }> {
  const supabase = await createClient()

  try {
    // Buscar configurações do negócio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('default_opening_time, default_closing_time, custom_hours_enabled')
      .eq('id', businessId)
      .single()

    if (businessError) {
      console.error('Erro ao buscar horários do negócio:', businessError)
      return { success: false, error: 'Erro ao buscar horários' }
    }

    // Buscar horários personalizados por dia
    const { data: customHours, error: customError } = await supabase
      .from('business_hours')
      .select('*')
      .eq('business_id', businessId)
      .order('day_of_week', { ascending: true })

    if (customError) {
      console.error('Erro ao buscar horários personalizados:', customError)
      return { success: false, error: 'Erro ao buscar horários personalizados' }
    }

    // Normalizar formato de horário: remover segundos se presentes
    const normalizeTime = (time: string) => {
      if (!time) return DEFAULT_START_TIME
      // Se for HH:MM:SS, retornar apenas HH:MM
      const parts = time.split(':')
      return `${parts[0]}:${parts[1]}`
    }

    return {
      success: true,
      data: {
        defaultOpening: normalizeTime(business.default_opening_time || DEFAULT_START_TIME),
        defaultClosing: normalizeTime(business.default_closing_time || DEFAULT_END_TIME),
        customHoursEnabled: business.custom_hours_enabled || false,
        customHours: customHours?.map((h) => ({
          dayOfWeek: h.day_of_week,
          openingTime: normalizeTime(h.opening_time),
          closingTime: normalizeTime(h.closing_time),
          isClosed: h.is_closed,
        })),
      },
    }
  } catch (error) {
    console.error('Erro ao buscar horários:', error)
    return { success: false, error: 'Erro ao buscar horários' }
  }
}

/**
 * Atualizar horários padrão (abertura e fechamento)
 */
export async function updateDefaultHours(businessId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = updateDefaultHoursSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const { openingTime, closingTime } = validation.data

  // Atualizar horários
  const { error } = await supabase
    .from('businesses')
    .update({
      default_opening_time: openingTime,
      default_closing_time: closingTime,
    })
    .eq('id', businessId)

  if (error) {
    console.error('Erro ao atualizar horários padrão:', error)
    return { success: false, error: 'Erro ao atualizar horários' }
  }

  revalidatePath(`/dashboard/${businessId}`)
  revalidatePath(`/dashboard/${businessId}/configuracoes`)
  return { success: true }
}

/**
 * Ativar/desativar horários personalizados por dia
 */
export async function toggleCustomHours(businessId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = toggleCustomHoursSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const { enabled } = validation.data

  // Atualizar flag
  const { error } = await supabase
    .from('businesses')
    .update({
      custom_hours_enabled: enabled,
    })
    .eq('id', businessId)

  if (error) {
    console.error('Erro ao atualizar flag de horários personalizados:', error)
    return { success: false, error: 'Erro ao atualizar configuração' }
  }

  revalidatePath(`/dashboard/${businessId}`)
  revalidatePath(`/dashboard/${businessId}/configuracoes`)
  return { success: true }
}

/**
 * Atualizar horários personalizados em lote
 */
export async function bulkUpdateDayHours(businessId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = bulkUpdateDayHoursSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const schedules = validation.data

  try {
    // Deletar horários existentes
    await supabase.from('business_hours').delete().eq('business_id', businessId)

    // Inserir novos horários
    const { error: insertError } = await supabase.from('business_hours').insert(
      schedules.map((s) => ({
        business_id: businessId,
        day_of_week: s.dayOfWeek,
        opening_time: s.openingTime,
        closing_time: s.closingTime,
        is_closed: s.isClosed,
      }))
    )

    if (insertError) {
      console.error('Erro ao inserir horários:', insertError)
      return { success: false, error: 'Erro ao salvar horários' }
    }

    revalidatePath(`/dashboard/${businessId}`)
    revalidatePath(`/dashboard/${businessId}/configuracoes`)
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar horários:', error)
    return { success: false, error: 'Erro ao atualizar horários' }
  }
}

/**
 * Obter horário de funcionamento para um dia específico
 */
export async function getBusinessHoursForDay(
  businessId: string,
  dayOfWeek: string
): Promise<{
  success: boolean
  data?: { opening: string; closing: string; isClosed: boolean }
  error?: string
}> {
  const supabase = await createClient()

  try {
    // Buscar configurações do negócio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('default_opening_time, default_closing_time, custom_hours_enabled')
      .eq('id', businessId)
      .single()

    if (businessError) {
      return { success: false, error: 'Erro ao buscar horários' }
    }

    // Normalizar formato de horário
    const normalizeTime = (time: string) => {
      if (!time) return DEFAULT_START_TIME
      const parts = time.split(':')
      return `${parts[0]}:${parts[1]}`
    }

    // Se não usa horários personalizados, retornar padrão
    if (!business.custom_hours_enabled) {
      return {
        success: true,
        data: {
          opening: normalizeTime(business.default_opening_time || DEFAULT_START_TIME),
          closing: normalizeTime(business.default_closing_time || DEFAULT_END_TIME),
          isClosed: false,
        },
      }
    }

    // Buscar horário personalizado para o dia
    const { data: dayHours, error: dayError } = await supabase
      .from('business_hours')
      .select('*')
      .eq('business_id', businessId)
      .eq('day_of_week', dayOfWeek)
      .single()

    if (dayError || !dayHours) {
      // Se não encontrou, usar horário padrão
      return {
        success: true,
        data: {
          opening: normalizeTime(business.default_opening_time || DEFAULT_START_TIME),
          closing: normalizeTime(business.default_closing_time || DEFAULT_END_TIME),
          isClosed: false,
        },
      }
    }

    return {
      success: true,
      data: {
        opening: normalizeTime(dayHours.opening_time),
        closing: normalizeTime(dayHours.closing_time),
        isClosed: dayHours.is_closed,
      },
    }
  } catch (error) {
    console.error('Erro ao buscar horários do dia:', error)
    return { success: false, error: 'Erro ao buscar horários' }
  }
}
