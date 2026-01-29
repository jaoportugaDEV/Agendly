// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

export interface BusinessMetrics {
  totalAppointments: number
  totalAppointmentsChange: number
  occupancyRate: number
  occupancyRateChange: number
  estimatedRevenue: number
  estimatedRevenueChange: number
  cancellationRate: number
  cancellationRateChange: number
  newCustomers: number
  returningCustomers: number
}

export interface ServicePerformance {
  serviceId: string
  serviceName: string
  totalAppointments: number
  revenue: number
  averageRating: number | null
}

export interface StaffPerformance {
  staffId: string
  staffName: string
  totalAppointments: number
  revenue: number
  averageRating: number | null
}

export interface AppointmentsByDay {
  date: string
  count: number
  revenue: number
}

export interface PeakHours {
  hour: number
  count: number
}

/**
 * Busca métricas principais do negócio
 */
export async function getBusinessAnalytics(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: BusinessMetrics; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Calcular período anterior para comparação
    const start = new Date(startDate)
    const end = new Date(endDate)
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const previousStart = subDays(start, periodDays)
    const previousEnd = start

    // Agendamentos do período atual
    const { data: currentAppointments } = await supabase
      .from('appointments')
      .select('id, status, price, start_time, customer_id')
      .eq('business_id', businessId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .is('deleted_at', null)

    // Agendamentos do período anterior
    const { data: previousAppointments } = await supabase
      .from('appointments')
      .select('id, status, price, customer_id')
      .eq('business_id', businessId)
      .gte('start_time', previousStart.toISOString())
      .lt('start_time', previousEnd.toISOString())
      .is('deleted_at', null)

    // Calcular métricas do período atual
    const totalAppointments = currentAppointments?.length || 0
    const confirmedOrCompleted = currentAppointments?.filter(
      a => a.status === 'confirmed' || a.status === 'completed'
    ) || []
    const cancelled = currentAppointments?.filter(a => a.status === 'cancelled') || []
    
    const estimatedRevenue = confirmedOrCompleted.reduce((sum, a) => sum + (a.price || 0), 0)
    const cancellationRate = totalAppointments > 0 
      ? (cancelled.length / totalAppointments) * 100 
      : 0

    // Calcular métricas do período anterior
    const previousTotal = previousAppointments?.length || 0
    const previousConfirmedOrCompleted = previousAppointments?.filter(
      a => a.status === 'confirmed' || a.status === 'completed'
    ) || []
    const previousCancelled = previousAppointments?.filter(a => a.status === 'cancelled') || []
    
    const previousRevenue = previousConfirmedOrCompleted.reduce((sum, a) => sum + (a.price || 0), 0)
    const previousCancellationRate = previousTotal > 0 
      ? (previousCancelled.length / previousTotal) * 100 
      : 0

    // Calcular variações percentuais
    const totalAppointmentsChange = previousTotal > 0
      ? ((totalAppointments - previousTotal) / previousTotal) * 100
      : totalAppointments > 0 ? 100 : 0

    const estimatedRevenueChange = previousRevenue > 0
      ? ((estimatedRevenue - previousRevenue) / previousRevenue) * 100
      : estimatedRevenue > 0 ? 100 : 0

    const cancellationRateChange = previousCancellationRate > 0
      ? cancellationRate - previousCancellationRate
      : 0

    // Clientes novos vs recorrentes
    const uniqueCustomers = new Set(currentAppointments?.map(a => a.customer_id))
    const customerIds = Array.from(uniqueCustomers)
    
    let newCustomers = 0
    let returningCustomers = 0

    for (const customerId of customerIds) {
      const { data: previousVisits } = await supabase
        .from('appointments')
        .select('id')
        .eq('customer_id', customerId)
        .eq('business_id', businessId)
        .lt('start_time', startDate)
        .is('deleted_at', null)
        .limit(1)

      if (previousVisits && previousVisits.length > 0) {
        returningCustomers++
      } else {
        newCustomers++
      }
    }

    // Taxa de ocupação (simplificado)
    // Assumindo 8h/dia, 30min por slot = 16 slots/dia
    const slotsPerDay = 16
    const totalDays = periodDays
    const totalPossibleSlots = totalDays * slotsPerDay
    const occupiedSlots = confirmedOrCompleted.length
    const occupancyRate = totalPossibleSlots > 0
      ? (occupiedSlots / totalPossibleSlots) * 100
      : 0

    // Taxa de ocupação período anterior
    const previousOccupiedSlots = previousConfirmedOrCompleted.length
    const previousOccupancyRate = totalPossibleSlots > 0
      ? (previousOccupiedSlots / totalPossibleSlots) * 100
      : 0

    const occupancyRateChange = previousOccupancyRate > 0
      ? occupancyRate - previousOccupancyRate
      : 0

    return {
      success: true,
      data: {
        totalAppointments,
        totalAppointmentsChange,
        occupancyRate: Number(occupancyRate.toFixed(2)),
        occupancyRateChange: Number(occupancyRateChange.toFixed(2)),
        estimatedRevenue: Number(estimatedRevenue.toFixed(2)),
        estimatedRevenueChange: Number(estimatedRevenueChange.toFixed(2)),
        cancellationRate: Number(cancellationRate.toFixed(2)),
        cancellationRateChange: Number(cancellationRateChange.toFixed(2)),
        newCustomers,
        returningCustomers,
      }
    }
  } catch (error) {
    console.error('Erro ao buscar analytics:', error)
    return { success: false, error: 'Erro ao buscar métricas' }
  }
}

/**
 * Busca performance de serviços
 */
export async function getServicePerformance(
  businessId: string,
  startDate: string,
  endDate: string,
  limit: number = 5
): Promise<{ success: boolean; data?: ServicePerformance[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        service_id,
        price,
        service:services(id, name),
        reviews:appointment_reviews(rating)
      `)
      .eq('business_id', businessId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .in('status', ['confirmed', 'completed'])
      .is('deleted_at', null)

    if (!appointments) {
      return { success: true, data: [] }
    }

    // Agrupar por serviço
    const serviceMap = new Map<string, {
      serviceName: string
      count: number
      revenue: number
      ratings: number[]
    }>()

    appointments.forEach(apt => {
      if (!apt.service_id) return

      const existing = serviceMap.get(apt.service_id) || {
        serviceName: apt.service?.name || 'Serviço',
        count: 0,
        revenue: 0,
        ratings: []
      }

      existing.count++
      existing.revenue += apt.price || 0
      
      if (apt.reviews && apt.reviews.length > 0) {
        existing.ratings.push(...apt.reviews.map((r: any) => r.rating))
      }

      serviceMap.set(apt.service_id, existing)
    })

    // Converter para array e ordenar
    const services: ServicePerformance[] = Array.from(serviceMap.entries())
      .map(([serviceId, data]) => ({
        serviceId,
        serviceName: data.serviceName,
        totalAppointments: data.count,
        revenue: Number(data.revenue.toFixed(2)),
        averageRating: data.ratings.length > 0
          ? Number((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1))
          : null
      }))
      .sort((a, b) => b.totalAppointments - a.totalAppointments)
      .slice(0, limit)

    return { success: true, data: services }
  } catch (error) {
    console.error('Erro ao buscar performance de serviços:', error)
    return { success: false, error: 'Erro ao buscar performance de serviços' }
  }
}

/**
 * Busca performance de funcionários
 */
export async function getStaffPerformance(
  businessId: string,
  startDate: string,
  endDate: string,
  limit: number = 5
): Promise<{ success: boolean; data?: StaffPerformance[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        staff_id,
        price,
        staff:users!appointments_staff_id_fkey(id, full_name),
        reviews:appointment_reviews(rating)
      `)
      .eq('business_id', businessId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .in('status', ['confirmed', 'completed'])
      .is('deleted_at', null)

    if (!appointments) {
      return { success: true, data: [] }
    }

    // Agrupar por staff
    const staffMap = new Map<string, {
      staffName: string
      count: number
      revenue: number
      ratings: number[]
    }>()

    appointments.forEach(apt => {
      if (!apt.staff_id) return

      const existing = staffMap.get(apt.staff_id) || {
        staffName: apt.staff?.full_name || 'Funcionário',
        count: 0,
        revenue: 0,
        ratings: []
      }

      existing.count++
      existing.revenue += apt.price || 0
      
      if (apt.reviews && apt.reviews.length > 0) {
        existing.ratings.push(...apt.reviews.map((r: any) => r.rating))
      }

      staffMap.set(apt.staff_id, existing)
    })

    // Converter para array e ordenar
    const staff: StaffPerformance[] = Array.from(staffMap.entries())
      .map(([staffId, data]) => ({
        staffId,
        staffName: data.staffName,
        totalAppointments: data.count,
        revenue: Number(data.revenue.toFixed(2)),
        averageRating: data.ratings.length > 0
          ? Number((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1))
          : null
      }))
      .sort((a, b) => b.totalAppointments - a.totalAppointments)
      .slice(0, limit)

    return { success: true, data: staff }
  } catch (error) {
    console.error('Erro ao buscar performance de staff:', error)
    return { success: false, error: 'Erro ao buscar performance de staff' }
  }
}

/**
 * Busca evolução diária de agendamentos
 */
export async function getAppointmentsByDay(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: AppointmentsByDay[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: appointments } = await supabase
      .from('appointments')
      .select('start_time, price, status')
      .eq('business_id', businessId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .in('status', ['confirmed', 'completed'])
      .is('deleted_at', null)
      .order('start_time', { ascending: true })

    if (!appointments) {
      return { success: true, data: [] }
    }

    // Agrupar por dia
    const dayMap = new Map<string, { count: number; revenue: number }>()

    appointments.forEach(apt => {
      const day = format(new Date(apt.start_time), 'yyyy-MM-dd')
      const existing = dayMap.get(day) || { count: 0, revenue: 0 }
      
      existing.count++
      existing.revenue += apt.price || 0
      
      dayMap.set(day, existing)
    })

    // Converter para array
    const byDay: AppointmentsByDay[] = Array.from(dayMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        revenue: Number(data.revenue.toFixed(2))
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return { success: true, data: byDay }
  } catch (error) {
    console.error('Erro ao buscar agendamentos por dia:', error)
    return { success: false, error: 'Erro ao buscar agendamentos por dia' }
  }
}

/**
 * Busca horários de pico
 */
export async function getPeakHours(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: PeakHours[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: appointments } = await supabase
      .from('appointments')
      .select('start_time')
      .eq('business_id', businessId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .in('status', ['confirmed', 'completed'])
      .is('deleted_at', null)

    if (!appointments) {
      return { success: true, data: [] }
    }

    // Agrupar por hora
    const hourMap = new Map<number, number>()

    appointments.forEach(apt => {
      const hour = new Date(apt.start_time).getHours()
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    })

    // Converter para array e ordenar
    const peakHours: PeakHours[] = Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour)

    return { success: true, data: peakHours }
  } catch (error) {
    console.error('Erro ao buscar horários de pico:', error)
    return { success: false, error: 'Erro ao buscar horários de pico' }
  }
}
