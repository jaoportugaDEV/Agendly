import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, parse, addMinutes, isAfter, isBefore } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const businessId = searchParams.get('businessId')
    const date = searchParams.get('date')
    const staffId = searchParams.get('staffId')
    const serviceId = searchParams.get('serviceId')
    const excludeId = searchParams.get('excludeId') // Para excluir o agendamento atual ao reagendar

    if (!businessId || !date || !staffId || !serviceId) {
      return NextResponse.json({ error: 'Parâmetros faltando' }, { status: 400 })
    }

    // Buscar serviço para saber a duração
    const { data: service } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .single()

    if (!service) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
    }

    const duration = service.duration_minutes

    // Buscar agendamentos existentes do dia
    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`

    let query = supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('business_id', businessId)
      .eq('staff_id', staffId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .is('deleted_at', null)
      .neq('status', 'cancelled')

    // Excluir o agendamento atual se estiver reagendando
    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data: existingAppointments } = await query

    // Gerar slots disponíveis (08:00 às 22:00, a cada 30 minutos)
    const slots: string[] = []
    const startHour = 8
    const endHour = 22
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const slotStart = parse(`${date} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date())
        const slotEnd = addMinutes(slotStart, duration)

        // Verificar se não tem conflito com agendamentos existentes
        const hasConflict = existingAppointments?.some((apt) => {
          const aptStart = new Date(apt.start_time)
          const aptEnd = new Date(apt.end_time)

          // Verifica se há sobreposição
          return (
            (isAfter(slotStart, aptStart) && isBefore(slotStart, aptEnd)) || // Slot começa durante outro
            (isAfter(slotEnd, aptStart) && isBefore(slotEnd, aptEnd)) || // Slot termina durante outro
            (isBefore(slotStart, aptStart) && isAfter(slotEnd, aptEnd)) // Slot engloba outro
          )
        })

        // Verificar se o slot já passou (se for hoje)
        const now = new Date()
        const isToday = format(now, 'yyyy-MM-dd') === date
        const isPast = isToday && isBefore(slotStart, now)

        if (!hasConflict && !isPast) {
          slots.push(timeStr)
        }
      }
    }

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Erro ao buscar horários disponíveis:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
