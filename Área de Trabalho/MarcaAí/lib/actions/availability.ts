// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import type { TimeSlot, DayOfWeek } from '@/types/shared'

// Map JavaScript day (0=Sunday) to our DayOfWeek type
const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

/**
 * Calculate available time slots for a specific date, service, and staff
 */
export async function getAvailableSlots(params: {
  businessId: string
  serviceId: string
  staffId: string
  date: string // YYYY-MM-DD
}): Promise<{ success: boolean; data?: TimeSlot[]; error?: string }> {
  const supabase = await createClient()
  const { businessId, serviceId, staffId, date } = params

  try {
    // 1. Get service duration
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .single()

    if (serviceError || !service) {
      return { success: false, error: 'Serviço não encontrado' }
    }

    const serviceDuration = service.duration_minutes

    // 2. Get business timezone
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('timezone')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return { success: false, error: 'Empresa não encontrada' }
    }

    // 3. Determine day of week from date
    const targetDate = new Date(date + 'T00:00:00')
    const dayOfWeek = DAY_MAP[targetDate.getDay()]

    // 4. Get staff schedule for this day
    const { data: schedules, error: scheduleError } = await supabase
      .from('staff_schedules')
      .select('start_time, end_time')
      .eq('staff_id', staffId)
      .eq('business_id', businessId)
      .eq('day_of_week', dayOfWeek)
      .eq('active', true)

    if (scheduleError || !schedules || schedules.length === 0) {
      // No schedule for this day - return empty slots
      return { success: true, data: [] }
    }

    const schedule = schedules[0]
    const workStartTime = schedule.start_time // e.g., "09:00:00"
    const workEndTime = schedule.end_time // e.g., "18:00:00"

    // 5. Get existing appointments for this staff on this date
    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('staff_id', staffId)
      .eq('business_id', businessId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .in('status', ['pending', 'confirmed'])
      .is('deleted_at', null)

    if (appointmentsError) {
      return { success: false, error: 'Erro ao verificar agendamentos' }
    }

    // 6. Generate time slots (every 15 minutes)
    const slots: TimeSlot[] = []
    const slotInterval = 15 // minutes

    // Parse work hours
    const [workStartHour, workStartMinute] = workStartTime.split(':').map(Number)
    const [workEndHour, workEndMinute] = workEndTime.split(':').map(Number)

    let currentHour = workStartHour
    let currentMinute = workStartMinute

    while (
      currentHour < workEndHour ||
      (currentHour === workEndHour && currentMinute < workEndMinute)
    ) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(
        currentMinute
      ).padStart(2, '0')}`
      
      const datetimeStr = `${date}T${timeStr}:00Z`

      // Check if this slot has enough time for the service
      // (must end before work end time)
      const slotEndMinutes = currentHour * 60 + currentMinute + serviceDuration
      const workEndMinutes = workEndHour * 60 + workEndMinute

      const hasEnoughTime = slotEndMinutes <= workEndMinutes

      // Check if this slot conflicts with any existing appointment
      let hasConflict = false
      if (hasEnoughTime && appointments) {
        const slotStart = new Date(datetimeStr)
        const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000)

        for (const apt of appointments) {
          const aptStart = new Date(apt.start_time)
          const aptEnd = new Date(apt.end_time)

          // Check for overlap
          if (
            (slotStart >= aptStart && slotStart < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (slotStart <= aptStart && slotEnd >= aptEnd)
          ) {
            hasConflict = true
            break
          }
        }
      }

      // Only add slot if it's in the future
      const now = new Date()
      const slotDateTime = new Date(datetimeStr)
      const isInFuture = slotDateTime > now

      slots.push({
        time: timeStr,
        datetime: datetimeStr,
        available: hasEnoughTime && !hasConflict && isInFuture,
      })

      // Increment by interval
      currentMinute += slotInterval
      if (currentMinute >= 60) {
        currentHour += 1
        currentMinute -= 60
      }
    }

    return { success: true, data: slots }
  } catch (error) {
    console.error('Error calculating availability:', error)
    return { success: false, error: 'Erro ao calcular disponibilidade' }
  }
}

/**
 * Validate if a specific time slot is still available
 * This should be called before creating an appointment to prevent race conditions
 */
export async function validateTimeSlot(params: {
  businessId: string
  staffId: string
  serviceId: string
  startTime: string // ISO datetime
}): Promise<{ success: boolean; available: boolean; reason?: string }> {
  const supabase = await createClient()
  const { businessId, staffId, serviceId, startTime } = params

  try {
    // 1. Get service duration
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .single()

    if (serviceError || !service) {
      return {
        success: true,
        available: false,
        reason: 'Serviço não encontrado',
      }
    }

    const serviceDuration = service.duration_minutes

    // 2. Calculate end time
    const startDate = new Date(startTime)
    const endDate = new Date(startDate.getTime() + serviceDuration * 60000)

    // 3. Check if time is in the future
    const now = new Date()
    if (startDate <= now) {
      return {
        success: true,
        available: false,
        reason: 'Horário já passou',
      }
    }

    // 4. Check for conflicts with existing appointments
    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('staff_id', staffId)
      .eq('business_id', businessId)
      .in('status', ['pending', 'confirmed'])
      .is('deleted_at', null)
      .or(
        `and(start_time.lte.${startTime},end_time.gt.${startTime}),` +
        `and(start_time.lt.${endDate.toISOString()},end_time.gte.${endDate.toISOString()}),` +
        `and(start_time.gte.${startTime},end_time.lte.${endDate.toISOString()})`
      )

    if (conflictError) {
      return {
        success: false,
        available: false,
        reason: 'Erro ao verificar disponibilidade',
      }
    }

    if (conflicts && conflicts.length > 0) {
      return {
        success: true,
        available: false,
        reason: 'Horário já está reservado',
      }
    }

    // 5. Check if staff is working at this time
    const targetDate = startDate
    const dayOfWeek = DAY_MAP[targetDate.getDay()]
    const targetTime = startDate.toTimeString().substring(0, 8)

    const { data: schedules, error: scheduleError } = await supabase
      .from('staff_schedules')
      .select('start_time, end_time')
      .eq('staff_id', staffId)
      .eq('business_id', businessId)
      .eq('day_of_week', dayOfWeek)
      .eq('active', true)

    if (scheduleError || !schedules || schedules.length === 0) {
      return {
        success: true,
        available: false,
        reason: 'Profissional não trabalha neste dia',
      }
    }

    const schedule = schedules[0]
    
    // Check if appointment fits within work hours
    const endTime = endDate.toTimeString().substring(0, 8)
    
    if (targetTime < schedule.start_time || endTime > schedule.end_time) {
      return {
        success: true,
        available: false,
        reason: 'Horário fora do expediente do profissional',
      }
    }

    // All checks passed
    return { success: true, available: true }
  } catch (error) {
    console.error('Error validating time slot:', error)
    return {
      success: false,
      available: false,
      reason: 'Erro ao validar horário',
    }
  }
}

/**
 * Get available slots for "any" staff member
 * Returns merged availability from all staff
 */
export async function getAvailableSlotsAnyStaff(params: {
  businessId: string
  serviceId: string
  date: string
}): Promise<{ success: boolean; data?: TimeSlot[]; error?: string }> {
  const supabase = await createClient()
  const { businessId, serviceId, date } = params

  try {
    // Get all active staff for this business
    const { data: members, error: membersError } = await supabase
      .from('business_members')
      .select('user_id')
      .eq('business_id', businessId)
      .eq('active', true)

    if (membersError || !members || members.length === 0) {
      return { success: true, data: [] }
    }

    // Get slots for each staff member
    const allSlotsPromises = members.map((member) =>
      getAvailableSlots({
        businessId,
        serviceId,
        staffId: member.user_id,
        date,
      })
    )

    const allSlotsResults = await Promise.all(allSlotsPromises)

    // Merge all slots - a time is available if ANY staff is available
    const mergedSlotsMap = new Map<string, TimeSlot>()

    for (const result of allSlotsResults) {
      if (result.success && result.data) {
        for (const slot of result.data) {
          const existing = mergedSlotsMap.get(slot.time)
          if (!existing || !existing.available) {
            mergedSlotsMap.set(slot.time, slot)
          }
        }
      }
    }

    // Convert map to array and sort by time
    const mergedSlots = Array.from(mergedSlotsMap.values()).sort((a, b) =>
      a.time.localeCompare(b.time)
    )

    return { success: true, data: mergedSlots }
  } catch (error) {
    console.error('Error getting availability for any staff:', error)
    return { success: false, error: 'Erro ao calcular disponibilidade' }
  }
}
