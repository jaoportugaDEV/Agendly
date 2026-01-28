// @ts-nocheck
'use server'

import { createPublicClient } from '@/lib/supabase/server'
import { getAuthenticatedClient } from '@/lib/utils/jwt'
import { revalidatePath } from 'next/cache'

/**
 * Busca agendamentos do cliente autenticado
 */
export async function getClientAppointments(filters?: {
  status?: 'future' | 'past' | 'all'
}) {
  try {
    const auth = await getAuthenticatedClient()
    if (!auth) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = createPublicClient()
    let query = supabase
      .from('appointments')
      .select(`
        *,
        service:services(id, name, duration_minutes),
        staff:users!appointments_staff_id_fkey(id, full_name),
        business:businesses(id, name, slug, phone, email, address),
        review:appointment_reviews(id, rating, comment)
      `)
      .eq('customer_id', auth.customerId)
      .is('deleted_at', null)

    const now = new Date().toISOString()

    if (filters?.status === 'future') {
      query = query.gte('start_time', now)
    } else if (filters?.status === 'past') {
      query = query.lt('start_time', now)
    }

    query = query.order('start_time', { ascending: filters?.status === 'future' })

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar agendamentos:', error)
      return { success: false, error: 'Erro ao buscar agendamentos' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error)
    return { success: false, error: 'Erro ao buscar agendamentos' }
  }
}

/**
 * Busca um agendamento específico
 */
export async function getClientAppointmentById(appointmentId: string) {
  try {
    const auth = await getAuthenticatedClient()
    if (!auth) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = createPublicClient()

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        service:services(id, name, duration_minutes, description),
        staff:users!appointments_staff_id_fkey(id, full_name, email),
        business:businesses(id, name, slug, phone, email, address, city),
        review:appointment_reviews(id, rating, comment)
      `)
      .eq('id', appointmentId)
      .eq('customer_id', auth.customerId)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      return { success: false, error: 'Agendamento não encontrado' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error)
    return { success: false, error: 'Erro ao buscar agendamento' }
  }
}

/**
 * Cancela um agendamento
 */
export async function cancelClientAppointment(appointmentId: string) {
  try {
    const auth = await getAuthenticatedClient()
    if (!auth) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = createPublicClient()

    // Buscar agendamento
    const { data: appointment } = await supabase
      .from('appointments')
      .select('start_time, status, customer_id')
      .eq('id', appointmentId)
      .single()

    if (!appointment || appointment.customer_id !== auth.customerId) {
      return { success: false, error: 'Agendamento não encontrado' }
    }

    if (appointment.status === 'cancelled') {
      return { success: false, error: 'Agendamento já foi cancelado' }
    }

    // Verificar se falta mais de 24h para o agendamento
    const hoursUntilAppointment = 
      (new Date(appointment.start_time).getTime() - new Date().getTime()) / (1000 * 60 * 60)

    const minHours = parseInt(process.env.APPOINTMENT_CANCEL_HOURS_BEFORE || '24')
    
    if (hoursUntilAppointment < minHours) {
      return { 
        success: false, 
        error: `Só é possível cancelar com pelo menos ${minHours}h de antecedência` 
      }
    }

    // Cancelar
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)

    if (error) {
      return { success: false, error: 'Erro ao cancelar agendamento' }
    }

    revalidatePath('/meus-agendamentos')
    return { success: true, message: 'Agendamento cancelado com sucesso' }
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error)
    return { success: false, error: 'Erro ao cancelar agendamento' }
  }
}

/**
 * Verifica se cliente pode cancelar agendamento
 */
export async function canCancelAppointment(appointmentId: string) {
  try {
    const auth = await getAuthenticatedClient()
    if (!auth) return { success: false, canCancel: false }

    const supabase = createPublicClient()

    const { data: appointment } = await supabase
      .from('appointments')
      .select('start_time, status')
      .eq('id', appointmentId)
      .eq('customer_id', auth.customerId)
      .single()

    if (!appointment) return { success: true, canCancel: false }
    if (appointment.status === 'cancelled') return { success: true, canCancel: false }

    const hoursUntilAppointment = 
      (new Date(appointment.start_time).getTime() - new Date().getTime()) / (1000 * 60 * 60)

    const minHours = parseInt(process.env.APPOINTMENT_CANCEL_HOURS_BEFORE || '24')
    const canCancel = hoursUntilAppointment >= minHours

    return { 
      success: true, 
      canCancel,
      hoursUntil: hoursUntilAppointment,
      minHours
    }
  } catch (error) {
    return { success: false, canCancel: false }
  }
}
