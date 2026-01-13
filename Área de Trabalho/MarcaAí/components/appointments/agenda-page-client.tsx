'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AppointmentFormDialog } from './appointment-form-dialog'
import { CalendarView } from './calendar-view'
import { getAppointments } from '@/lib/actions/appointments'

interface AgendaPageClientProps {
  businessId: string
  initialAppointments: any[]
  services: any[]
  staff: any[]
}

export function AgendaPageClient({
  businessId,
  initialAppointments,
  services,
  staff,
}: AgendaPageClientProps) {
  const router = useRouter()
  const [appointments, setAppointments] = useState(initialAppointments)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAppointments()
  }, [selectedDate, selectedStaffId])

  const loadAppointments = async () => {
    setLoading(true)

    // Calcular range de datas (uma semana antes e uma semana depois)
    const startDate = new Date(selectedDate)
    startDate.setDate(startDate.getDate() - 7)
    
    const endDate = new Date(selectedDate)
    endDate.setDate(endDate.getDate() + 7)

    const result = await getAppointments(businessId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      staffId: selectedStaffId || undefined,
    })

    if (result.success) {
      setAppointments(result.data || [])
    }

    setLoading(false)
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  const handleStaffFilter = (staffId: string | null) => {
    setSelectedStaffId(staffId)
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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          }
        />
      </div>

      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          Carregando agendamentos...
        </div>
      )}

      {!loading && (
        <CalendarView
          appointments={appointments}
          staff={staff}
          onDateChange={handleDateChange}
          onStaffFilter={handleStaffFilter}
        />
      )}
    </div>
  )
}
