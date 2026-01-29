'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, addDays, subDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileDayViewProps {
  appointments: any[]
  blocks: any[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onSelectAppointment: (appointment: any) => void
  onSelectSlot: (time: string) => void
  businessHours?: { opening: string; closing: string }
  className?: string
}

export function MobileDayView({
  appointments,
  blocks,
  currentDate,
  onDateChange,
  onSelectAppointment,
  onSelectSlot,
  businessHours,
  className,
}: MobileDayViewProps) {
  // Calcular horas dinamicamente baseado nos horários do estabelecimento
  const startHour = businessHours?.opening 
    ? parseInt(businessHours.opening.split(':')[0]) 
    : 8
  
  // Para o horário final, garantir que mostre a hora de fechamento completa
  // Se o fechamento é 20:00, queremos mostrar a linha das 20:00
  const endHour = businessHours?.closing 
    ? parseInt(businessHours.closing.split(':')[0]) 
    : 21
  
  const hours = Array.from(
    { length: endHour - startHour + 1 }, 
    (_, i) => i + startHour
  )

  const getEventsForHour = (hour: number) => {
    const hourStr = `${hour.toString().padStart(2, '0')}:00`
    const dateStr = format(currentDate, 'yyyy-MM-dd')

    // Buscar agendamentos neste horário
    const dayAppointments = appointments.filter((apt) => {
      const aptStart = new Date(apt.start_time)
      const aptHour = aptStart.getHours()
      const aptDate = format(aptStart, 'yyyy-MM-dd')
      return aptDate === dateStr && aptHour === hour
    })

    // Buscar bloqueios neste horário
    const dayBlocks = blocks.filter((block) => {
      const blockStart = new Date(block.start_time)
      const blockHour = blockStart.getHours()
      const blockDate = format(blockStart, 'yyyy-MM-dd')
      return blockDate === dateStr && blockHour === hour
    })

    return { appointments: dayAppointments, blocks: dayBlocks }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500',
      no_show: 'bg-orange-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Navegação de Data */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDateChange(subDays(currentDate, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center">
            <p className="text-lg font-bold">
              {format(currentDate, "EEEE", { locale: ptBR })}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDateChange(addDays(currentDate, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange(new Date())}
          className="w-full"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Hoje
        </Button>
      </div>

      {/* Timeline de Horários */}
      <div className="flex-1 overflow-y-auto">
        {hours.map((hour) => {
          const { appointments: hourAppts, blocks: hourBlocks } = getEventsForHour(hour)
          const hasEvents = hourAppts.length > 0 || hourBlocks.length > 0

          return (
            <div key={hour} className="border-b">
              {/* Linha de Hora */}
              <div className="flex">
                {/* Horário */}
                <div className="w-16 flex-shrink-0 p-3 text-sm font-medium text-muted-foreground border-r">
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>

                {/* Área de Eventos */}
                <div className="flex-1 min-h-[80px]">
                  {!hasEvents ? (
                    // Slot vazio - clicável
                    <button
                      onClick={() => onSelectSlot(`${hour.toString().padStart(2, '0')}:00`)}
                      className="w-full h-full p-3 text-left hover:bg-accent transition-colors"
                    >
                      <span className="text-xs text-muted-foreground">Clique para adicionar</span>
                    </button>
                  ) : (
                    <div className="p-2 space-y-2">
                      {/* Bloqueios */}
                      {hourBlocks.map((block) => (
                        <div
                          key={block.id}
                          className="p-3 rounded-lg cursor-pointer bg-gray-700 text-white"
                          style={{
                            borderBottom: `4px solid ${block.color || '#ef4444'}`,
                          }}
                          onClick={() => onSelectAppointment(block)}
                        >
                          <p className="font-semibold text-sm">{block.reason}</p>
                          <p className="text-xs opacity-80">
                            {format(new Date(block.start_time), 'HH:mm')} - {format(new Date(block.end_time), 'HH:mm')}
                          </p>
                        </div>
                      ))}

                      {/* Agendamentos */}
                      {hourAppts.map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            'p-3 rounded-lg cursor-pointer text-white',
                            getStatusColor(apt.status)
                          )}
                          onClick={() => onSelectAppointment(apt)}
                        >
                          <p className="font-semibold text-sm">
                            {apt.customer?.name || 'Cliente'}
                          </p>
                          <p className="text-xs opacity-90">
                            {apt.service?.name}
                          </p>
                          <p className="text-xs opacity-80">
                            {format(new Date(apt.start_time), 'HH:mm')} - {format(new Date(apt.end_time), 'HH:mm')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
