'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Users, User } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppointmentFormDialog } from './appointment-form-dialog'
import { FullCalendarView } from './fullcalendar-view'
import { MobileDayView } from './mobile-day-view'
import { AppointmentDetailsModal } from './appointment-details-modal'
import { BlockDetailsModal } from './block-details-modal'
import { ReschedulePicker } from './reschedule-picker'
import { AddEventDialog } from './add-event-dialog'
import { BlockFormDialog } from './block-form-dialog'
import { getAppointments, updateAppointmentTime } from '@/lib/actions/appointments'
import { getBusinessHours } from '@/lib/actions/business-hours'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DEFAULT_START_TIME, DEFAULT_END_TIME } from '@/lib/constants'

interface AgendaPageClientProps {
  businessId: string
  initialAppointments: any[]
  services: any[]
  staff: any[]
  currentUserId: string
  currency?: string
}

export function AgendaPageClient({
  businessId,
  initialAppointments,
  services,
  staff,
  currentUserId,
  currency = 'BRL'
}: AgendaPageClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [appointments, setAppointments] = useState(initialAppointments)
  const [blocks, setBlocks] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(currentUserId) // Inicia com usuário atual
  const [loading, setLoading] = useState(false)
  
  // Estado para horários do estabelecimento
  const [businessHours, setBusinessHours] = useState<{ opening: string; closing: string }>({
    opening: DEFAULT_START_TIME,
    closing: DEFAULT_END_TIME,
  })
  
  // Estados para detalhes e reagendamento
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [blockDetailsOpen, setBlockDetailsOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  
  // Estados para adicionar eventos
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [blockFormOpen, setBlockFormOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start?: Date; time?: string } | null>(null)

  // Carregar horários do estabelecimento
  useEffect(() => {
    loadBusinessHours()
  }, [businessId])

  useEffect(() => {
    loadData()
  }, [selectedDate, selectedStaffId])

  const loadBusinessHours = async () => {
    const result = await getBusinessHours(businessId)
    console.log('🕐 Business Hours Loaded:', result)
    if (result.success && result.data) {
      const hours = {
        opening: result.data.defaultOpening,
        closing: result.data.defaultClosing,
      }
      console.log('🕐 Setting Business Hours:', hours)
      setBusinessHours(hours)
    }
  }

  const loadData = async () => {
    setLoading(true)

    // Calcular range de datas (uma semana antes e uma semana depois)
    const startDate = new Date(selectedDate)
    startDate.setDate(startDate.getDate() - 7)
    
    const endDate = new Date(selectedDate)
    endDate.setDate(endDate.getDate() + 7)

    // Carregar agendamentos
    const result = await getAppointments(businessId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      staffId: selectedStaffId || undefined,
    })

    if (result.success) {
      setAppointments(result.data || [])
    }

    // Carregar bloqueios
    try {
      // Construir URL com filtro de staff se selecionado
      let blocksUrl = `/api/schedule-blocks?businessId=${businessId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      if (selectedStaffId) {
        blocksUrl += `&staffId=${selectedStaffId}`
      }
      
      const blocksResponse = await fetch(blocksUrl)
      if (blocksResponse.ok) {
        const blocksData = await blocksResponse.json()
        setBlocks(blocksData.blocks || [])
      }
    } catch (error) {
      console.error('Erro ao carregar bloqueios:', error)
    }

    setLoading(false)
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  const handleStaffFilter = (staffId: string | null) => {
    setSelectedStaffId(staffId)
  }

  const handleSelectAppointment = async (item: any) => {
    // Verificar se é agendamento ou bloqueio
    if (item.reason && item.color) {
      // É um bloqueio
      const updated = blocks.find(b => b.id === item.id)
      setSelectedBlock(updated || item)
      setBlockDetailsOpen(true)
    } else {
      // É um agendamento
      const updated = appointments.find(apt => apt.id === item.id)
      setSelectedAppointment(updated || item)
      setDetailsOpen(true)
    }
  }

  const handleUpdate = async () => {
    await loadData()
    // Atualizar também o appointment selecionado se ainda estiver aberto
    if (selectedAppointment) {
      const updated = appointments.find(apt => apt.id === selectedAppointment.id)
      if (updated) {
        setSelectedAppointment(updated)
      }
    }
  }

  const handleSelectSlot = (slotInfo: any) => {
    if (slotInfo.start) {
      setSelectedSlot({ start: slotInfo.start })
    } else if (slotInfo) {
      // Mobile - apenas time string
      setSelectedSlot({ time: slotInfo })
    }
    setAddEventOpen(true)
  }

  const handleAddEventType = (type: 'appointment' | 'block') => {
    if (type === 'block') {
      setBlockFormOpen(true)
    } else {
      // Abrir form de agendamento (já existe via botão)
      toast({
        title: 'Use o botão "Novo Agendamento"',
        description: 'Clique no botão no canto superior direito',
      })
    }
  }

  const handleEventDrop = async ({ event, start, end }: { event: any; start: Date; end: Date }) => {
    // Atualização otimista - atualiza localmente primeiro
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === event.id 
          ? { ...apt, start_time: start.toISOString(), end_time: end.toISOString() }
          : apt
      )
    )

    const result = await updateAppointmentTime(
      event.id,
      start.toISOString(),
      end.toISOString()
    )

    if (result.success) {
      toast({
        title: 'Agendamento atualizado',
        description: 'Horário alterado com sucesso',
      })
      // Recarregar para garantir sincronização
      await loadData()
    } else {
      toast({
        title: 'Erro ao atualizar',
        description: result.error,
        variant: 'destructive',
      })
      // Reverter em caso de erro
      await loadData()
    }
  }

  const handleReschedule = (appointment: any) => {
    setSelectedAppointment(appointment)
    setDetailsOpen(false)
    setRescheduleOpen(true)
  }

  const handleRescheduleConfirm = async (newStartTime: string, newEndTime: string) => {
    if (!selectedAppointment) return

    await handleEventDrop({
      event: selectedAppointment,
      start: new Date(newStartTime),
      end: new Date(newEndTime),
    })

    setRescheduleOpen(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie os agendamentos
          </p>
        </div>
        <AppointmentFormDialog
          businessId={businessId}
          services={services}
          staff={staff}
          trigger={
            <Button className="tour-create-button">
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          }
        />
      </div>

      {/* Filtro de Funcionários */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="font-medium">Visualizar agenda de:</span>
        </div>
        <Select
          value={selectedStaffId || currentUserId}
          onValueChange={(value) => setSelectedStaffId(value)}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Selecione um funcionário" />
          </SelectTrigger>
          <SelectContent>
            {staff.map((s) => {
              const staffUserId = s.user_id || s.users?.id
              const isCurrentUser = staffUserId === currentUserId
              return (
                <SelectItem key={s.id} value={staffUserId}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {s.users?.full_name || s.users?.email || 'Funcionário'}
                      {isCurrentUser && ' (Você)'}
                    </span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando agendamentos...
        </div>
      ) : (
        <>
          {/* Desktop: FullCalendar com Drag & Drop */}
          <FullCalendarView
            className="hidden md:block tour-calendar"
            appointments={appointments}
            blocks={blocks}
            onSelectEvent={handleSelectAppointment}
            onEventDrop={handleEventDrop}
            onSelectSlot={handleSelectSlot}
            businessHours={businessHours}
          />

          {/* Mobile: View de 1 dia */}
          <MobileDayView
            className="md:hidden"
            appointments={appointments}
            blocks={blocks}
            currentDate={selectedDate}
            onDateChange={setSelectedDate}
            onSelectAppointment={handleSelectAppointment}
            onSelectSlot={handleSelectSlot}
            businessHours={businessHours}
          />

          {/* Modal de Detalhes - Agendamento */}
          <AppointmentDetailsModal
            appointment={selectedAppointment}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            onUpdate={handleUpdate}
            onReschedule={handleReschedule}
            currency={currency}
          />

          {/* Modal de Detalhes - Bloqueio */}
          <BlockDetailsModal
            block={selectedBlock}
            open={blockDetailsOpen}
            onOpenChange={setBlockDetailsOpen}
            onUpdate={handleUpdate}
          />

          {/* Modal de Reagendamento */}
          <ReschedulePicker
            appointment={selectedAppointment}
            open={rescheduleOpen}
            onOpenChange={setRescheduleOpen}
            onConfirm={handleRescheduleConfirm}
            businessId={businessId}
          />

          {/* Modal: O que adicionar? */}
          <AddEventDialog
            open={addEventOpen}
            onOpenChange={setAddEventOpen}
            onSelectType={handleAddEventType}
            selectedTime={selectedSlot?.time || (selectedSlot?.start ? format(selectedSlot.start, 'HH:mm') : undefined)}
          />

          {/* Modal: Form de Bloqueio */}
          <BlockFormDialog
            open={blockFormOpen}
            onOpenChange={setBlockFormOpen}
            businessId={businessId}
            staff={staff}
            selectedDate={selectedSlot?.start || selectedDate}
            selectedTime={selectedSlot?.time || (selectedSlot?.start ? format(selectedSlot.start, 'HH:mm') : undefined)}
            onSuccess={handleUpdate}
          />
        </>
      )}
    </div>
  )
}
