import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addDays, addWeeks, addMonths, isBefore, parseISO } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    let { businessId, staffId, appliesToAll, reason, startTime, endTime, color, frequency, weekday, selectedWeekdays, endDate } = body
    
    console.log('Dados recebidos:', { businessId, staffId, appliesToAll, reason, startTime, endTime, color, frequency, selectedWeekdays })
    
    // Se não é para todos e staffId estiver vazio, usar o ID do usuário atual
    if (!appliesToAll && (!staffId || staffId === '')) {
      staffId = user.id
      console.log('staffId vazio, usando user.id:', staffId)
    }
    
    // Se é para todos, staffId deve ser null
    if (appliesToAll) {
      staffId = null
    }

    // Verificar permissão
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Criar bloqueios baseado na frequência
    const blocksToCreate: any[] = []
    const start = parseISO(startTime)
    const end = parseISO(endTime)
    const finalEndDate = endDate ? parseISO(endDate) : null

    if (frequency === 'once') {
      // Apenas uma vez
      blocksToCreate.push({
        business_id: businessId,
        staff_id: staffId,
        applies_to_all: appliesToAll || false,
        reason,
        start_time: startTime,
        end_time: endTime,
        color,
        is_recurring: false,
      })
    } else if (frequency === 'custom_weekly' && selectedWeekdays && selectedWeekdays.length > 0) {
      // Recorrente em dias específicos da semana
      let currentDate = start
      let count = 0
      const maxOccurrences = 365 // 1 ano de dias

      while (count < maxOccurrences) {
        // Verificar se passou da data final
        if (finalEndDate && isBefore(finalEndDate, currentDate)) {
          break
        }

        // Verificar se o dia atual está nos dias selecionados
        const currentDayOfWeek = currentDate.getDay()
        if (selectedWeekdays.includes(currentDayOfWeek)) {
          // Criar bloqueio
          const blockStart = new Date(currentDate)
          blockStart.setHours(start.getHours(), start.getMinutes())
          
          const blockEnd = new Date(currentDate)
          blockEnd.setHours(end.getHours(), end.getMinutes())

          blocksToCreate.push({
            business_id: businessId,
            staff_id: staffId,
            applies_to_all: appliesToAll || false,
            reason,
            start_time: blockStart.toISOString(),
            end_time: blockEnd.toISOString(),
            color,
            is_recurring: true,
            recurrence_pattern: 'custom_weekly',
          })

          count++
        }

        // Avançar para o próximo dia
        currentDate = addDays(currentDate, 1)
      }
    } else {
      // Recorrente - criar próximas 52 ocorrências ou até endDate
      let currentDate = start
      let count = 0
      const maxOccurrences = 52 // 1 ano

      while (count < maxOccurrences) {
        // Verificar se passou da data final
        if (finalEndDate && isBefore(finalEndDate, currentDate)) {
          break
        }

        // Verificar dia da semana (se semanal)
        if (frequency === 'weekly' && weekday !== null) {
          if (currentDate.getDay() !== weekday) {
            currentDate = addDays(currentDate, 1)
            continue
          }
        }

        // Criar bloqueio
        const blockStart = new Date(currentDate)
        blockStart.setHours(start.getHours(), start.getMinutes())
        
        const blockEnd = new Date(currentDate)
        blockEnd.setHours(end.getHours(), end.getMinutes())

        blocksToCreate.push({
          business_id: businessId,
          staff_id: staffId,
          applies_to_all: appliesToAll || false,
          reason,
          start_time: blockStart.toISOString(),
          end_time: blockEnd.toISOString(),
          color,
          is_recurring: true,
          recurrence_pattern: frequency,
        })

        // Avançar para próxima ocorrência
        if (frequency === 'daily') {
          currentDate = addDays(currentDate, 1)
        } else if (frequency === 'weekly') {
          currentDate = addWeeks(currentDate, 1)
        } else if (frequency === 'monthly') {
          currentDate = addMonths(currentDate, 1)
        }

        count++
      }
    }

    // Inserir todos os bloqueios
    const { error } = await supabase
      .from('schedule_blocks')
      .insert(blocksToCreate)

    if (error) {
      console.error('Erro ao criar bloqueios:', error)
      return NextResponse.json({ error: 'Erro ao criar bloqueios' }, { status: 500 })
    }

    revalidatePath(`/${businessId}/agenda`)
    return NextResponse.json({ success: true, count: blocksToCreate.length })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const businessId = searchParams.get('businessId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const staffId = searchParams.get('staffId') // Filtro opcional por funcionário

    if (!businessId) {
      return NextResponse.json({ error: 'businessId obrigatório' }, { status: 400 })
    }

    let query = supabase
      .from('schedule_blocks')
      .select('*')
      .eq('business_id', businessId)

    // Filtrar por funcionário se especificado
    if (staffId) {
      // Buscar bloqueios do funcionário específico OU bloqueios para todos
      query = query.or(`staff_id.eq.${staffId},applies_to_all.eq.true`)
    }

    if (startDate) {
      query = query.gte('start_time', startDate)
    }
    if (endDate) {
      query = query.lte('start_time', endDate)
    }

    const { data, error } = await query.order('start_time', { ascending: true })

    if (error) {
      console.error('Erro ao buscar bloqueios:', error)
      return NextResponse.json({ error: 'Erro ao buscar bloqueios' }, { status: 500 })
    }

    return NextResponse.json({ blocks: data })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
