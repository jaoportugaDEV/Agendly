// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from '@/lib/validations/appointment'
import { revalidatePath } from 'next/cache'

export async function getAppointments(
  businessId: string,
  filters?: {
    startDate?: string
    endDate?: string
    staffId?: string
    status?: string
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from('appointments')
    .select(`
      *,
      customer:customers(id, name, email, phone),
      staff:users!appointments_staff_id_fkey(id, full_name, email),
      service:services(id, name, duration_minutes, price)
    `)
    .eq('business_id', businessId)
    .is('deleted_at', null)

  if (filters?.startDate) {
    query = query.gte('start_time', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('start_time', filters.endDate)
  }
  if (filters?.staffId) {
    query = query.eq('staff_id', filters.staffId)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  query = query.order('start_time', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar agendamentos:', error)
    return { success: false, error: 'Erro ao buscar agendamentos' }
  }

  return { success: true, data }
}

export async function getAppointmentById(appointmentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customer:customers(id, name, email, phone),
      staff:users!appointments_staff_id_fkey(id, full_name, email),
      service:services(id, name, duration_minutes, price)
    `)
    .eq('id', appointmentId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Erro ao buscar agendamento:', error)
    return { success: false, error: 'Erro ao buscar agendamento' }
  }

  return { success: true, data }
}

export async function createAppointment(businessId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = createAppointmentSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const { staffId, customerId, serviceId, startTime, notes } = validation.data

  // Buscar serviço para obter duração e preço
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('duration_minutes, price, currency')
    .eq('id', serviceId)
    .single()

  if (serviceError || !service) {
    return { success: false, error: 'Serviço não encontrado' }
  }

  // Calcular end_time
  const startDate = new Date(startTime)
  const endDate = new Date(startDate.getTime() + (service as any).duration_minutes * 60000)

  // Criar agendamento (o trigger check_appointment_conflict já valida conflitos)
  const { data, error } = await (supabase
    .from('appointments') as any)
    .insert({
      business_id: businessId,
      staff_id: staffId,
      customer_id: customerId,
      service_id: serviceId,
      start_time: startTime,
      end_time: endDate.toISOString(),
      price: (service as any).price,
      currency: (service as any).currency,
      status: 'confirmed',
      notes,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar agendamento:', error)
    // Verificar se é erro de conflito
    if (error.message.includes('Conflito de horário')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro ao criar agendamento' }
  }

  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function updateAppointment(appointmentId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = updateAppointmentSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const updateData: Record<string, unknown> = {}

  if (validation.data.staffId !== undefined) {
    updateData.staff_id = validation.data.staffId
  }
  if (validation.data.customerId !== undefined) {
    updateData.customer_id = validation.data.customerId
  }
  if (validation.data.serviceId !== undefined) {
    updateData.service_id = validation.data.serviceId

    // Atualizar preço e end_time se o serviço mudou
    const { data: service } = await supabase
      .from('services')
      .select('duration_minutes, price, currency')
      .eq('id', validation.data.serviceId)
      .single()

    if (service) {
      updateData.price = (service as any).price
      updateData.currency = (service as any).currency

      // Se temos startTime, recalcular endTime
      if (validation.data.startTime) {
        const startDate = new Date(validation.data.startTime)
        const endDate = new Date(startDate.getTime() + (service as any).duration_minutes * 60000)
        updateData.end_time = endDate.toISOString()
      }
    }
  }
  if (validation.data.startTime !== undefined) {
    updateData.start_time = validation.data.startTime

    // Recalcular end_time
    const { data: appointment } = await supabase
      .from('appointments')
      .select('service_id')
      .eq('id', appointmentId)
      .single()

    if (appointment) {
      const { data: service } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', (appointment as any).service_id)
        .single()

      if (service) {
        const startDate = new Date(validation.data.startTime)
        const endDate = new Date(startDate.getTime() + (service as any).duration_minutes * 60000)
        updateData.end_time = endDate.toISOString()
      }
    }
  }
  if (validation.data.status !== undefined) {
    updateData.status = validation.data.status
  }
  if (validation.data.notes !== undefined) {
    updateData.notes = validation.data.notes
  }

  // Atualizar agendamento
  const { data, error } = await (supabase
    .from('appointments') as any)
    .update(updateData)
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar agendamento:', error)
    if (error.message.includes('Conflito de horário')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro ao atualizar agendamento' }
  }

  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function cancelAppointment(appointmentId: string) {
  return updateAppointment(appointmentId, { status: 'cancelled' })
}

export async function completeAppointment(appointmentId: string) {
  return updateAppointment(appointmentId, { status: 'completed' })
}

export async function deleteAppointment(appointmentId: string) {
  const supabase = await createClient()

  // Soft delete
  const { error } = await (supabase
    .from('appointments') as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', appointmentId)

  if (error) {
    console.error('Erro ao deletar agendamento:', error)
    return { success: false, error: 'Erro ao deletar agendamento' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
