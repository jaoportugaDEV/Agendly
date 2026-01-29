'use client'

import { useRef, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import { STATUS_COLORS } from '@/types/shared'

interface FullCalendarViewProps {
  appointments: any[]
  blocks: any[]
  onSelectEvent: (appointment: any) => void
  onEventDrop: (data: { event: any; start: Date; end: Date }) => Promise<void>
  onSelectSlot?: (info: { start: Date; end: Date }) => void
  businessHours?: { opening: string; closing: string }
  className?: string
}

export function FullCalendarView({
  appointments,
  blocks,
  onSelectEvent,
  onEventDrop,
  onSelectSlot,
  businessHours,
  className,
}: FullCalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null)

  // Calcular slotMaxTime com buffer extra para mostrar até o horário de fechamento
  const getSlotMaxTime = () => {
    if (!businessHours?.closing) return '23:00:00'
    
    console.log('📅 FullCalendar - Business Hours:', businessHours)
    
    // Adicionar 1 hora extra para garantir que slots até o horário de fechamento sejam exibidos
    const [hours, minutes] = businessHours.closing.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + 60 // +60 minutos de buffer
    const newHours = Math.floor(totalMinutes / 60)
    const newMinutes = totalMinutes % 60
    
    const maxTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:00`
    console.log('📅 FullCalendar - slotMinTime:', businessHours.opening ? `${businessHours.opening}:00` : '07:00:00')
    console.log('📅 FullCalendar - slotMaxTime:', maxTime)
    
    return maxTime
  }

  // Ícones por status
  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      pending: '⏳',
      confirmed: '✓',
      completed: '✔',
      cancelled: '✕',
      no_show: '⚠',
    }
    return icons[status] || ''
  }

  // Converter Tailwind color para HEX
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'bg-yellow-500': '#eab308',
      'bg-blue-500': '#3b82f6',
      'bg-red-500': '#ef4444',
      'bg-green-500': '#22c55e',
      'bg-gray-500': '#6b7280',
      'bg-orange-500': '#f97316',
    }
    return colorMap[STATUS_COLORS[status as keyof typeof STATUS_COLORS]] || '#6b7280'
  }

  // Converter appointments e blocks para eventos do FullCalendar
  const events = [
    // Agendamentos
    ...appointments.map((apt) => ({
      id: `apt-${apt.id}`,
      title: `${getStatusIcon(apt.status)} ${apt.customer?.name || 'Cliente'} - ${apt.service?.name || 'Serviço'}`,
      start: apt.start_time,
      end: apt.end_time,
      backgroundColor: getStatusColor(apt.status),
      borderColor: getStatusColor(apt.status),
      extendedProps: {
        type: 'appointment',
        appointment: apt,
      },
    })),
    // Bloqueios
    ...blocks.map((block) => {
      // Garantir que as datas estão no formato correto (ISO string ou Date)
      const startDate = new Date(block.start_time)
      const endDate = new Date(block.end_time)
      
      // Debug: verificar formato das datas
      console.log('Bloqueio:', {
        id: block.id,
        reason: block.reason,
        start_original: block.start_time,
        end_original: block.end_time,
        start_parsed: startDate.toISOString(),
        end_parsed: endDate.toISOString(),
        duration_minutes: (endDate.getTime() - startDate.getTime()) / (1000 * 60),
      })
      
      return {
        id: `block-${block.id}`,
        title: block.reason,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: '#374151',
        borderColor: 'transparent',
        textColor: '#ffffff',
        display: 'block', // Garantir que seja exibido como bloco
        allDay: false, // Não é evento de dia inteiro
        extendedProps: {
          type: 'block',
          block: block,
          blockColor: block.color,
        },
        classNames: ['schedule-block'],
        editable: false, // Bloqueios não podem ser arrastados
        durationEditable: false,
        startEditable: false,
      }
    }),
  ]

  // Adicionar estilo customizado aos bloqueios após renderizar
  const handleEventDidMount = useCallback((info: any) => {
    if (info.event.extendedProps.type === 'block') {
      const blockColor = info.event.extendedProps.blockColor || '#ef4444'
      info.el.style.setProperty('--block-color', blockColor)
    }
  }, [])

  // Handler de click em evento
  const handleEventClick = useCallback((info: any) => {
    const { type, appointment, block } = info.event.extendedProps
    if (type === 'appointment') {
      onSelectEvent(appointment)
    } else if (type === 'block') {
      onSelectEvent(block)
    }
  }, [onSelectEvent])

  // Handler de click em slot vazio
  const handleDateClick = useCallback((info: any) => {
    if (onSelectSlot) {
      const end = new Date(info.date)
      end.setMinutes(end.getMinutes() + 60) // 1 hora por padrão
      onSelectSlot({ start: info.date, end })
    }
  }, [onSelectSlot])

  // Handler de drop/resize
  const handleEventChange = useCallback(async (info: any) => {
    const { type, appointment } = info.event.extendedProps
    
    // Só permite drag/drop de agendamentos, não de bloqueios
    if (type !== 'appointment') {
      info.revert()
      return
    }

    const newStart = info.event.start
    const newEnd = info.event.end

    await onEventDrop({
      event: appointment,
      start: newStart,
      end: newEnd,
    })

    // Se falhar, reverter
    if (!info.event.id) {
      info.revert()
    }
  }, [onEventDrop])

  return (
    <div className={className}>
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={ptBrLocale}
        height="auto"
        contentHeight="auto"
        aspectRatio={1.8}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        slotMinTime={businessHours?.opening ? `${businessHours.opening}:00` : '07:00:00'}
        slotMaxTime={getSlotMaxTime()}
        slotDuration="00:15:00"
        slotLabelInterval="00:30:00"
        allDaySlot={false}
        events={events}
        editable={true}
        droppable={true}
        eventResizableFromStart={true}
        eventClick={handleEventClick}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        dateClick={handleDateClick}
        eventDidMount={handleEventDidMount}
        nowIndicator={true}
        selectable={true}
        scrollTime="08:00:00"
        scrollTimeReset={false}
        dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        buttonText={{
          today: 'Hoje',
          week: 'Semana',
          day: 'Dia',
        }}
        weekends={true}
        selectMirror={true}
        dayMaxEvents={true}
        eventMaxStack={3}
      />
    </div>
  )
}
