'use client'

import { useState, useEffect } from 'react'
import { CalendarView } from './calendar-view'
import { getAppointments } from '@/lib/actions/appointments'

interface StaffAgendaPageClientProps {
  businessId: string
  initialAppointments: any[]
  staffId: string
}

export function StaffAgendaPageClient({
  businessId,
  initialAppointments,
  staffId,
}: StaffAgendaPageClientProps) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAppointments()
  }, [selectedDate])

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
      staffId, // Sempre filtrar pelo staff logado
    })

    if (result.success) {
      setAppointments(result.data || [])
    }

    setLoading(false)
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Minha Agenda</h1>
        <p className="text-muted-foreground mt-1">
          Visualize seus agendamentos
        </p>
      </div>

      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          Carregando agendamentos...
        </div>
      )}

      {!loading && (
        <CalendarView
          appointments={appointments}
          staff={[]} // Staff não precisa ver filtro de staff
          onDateChange={handleDateChange}
          onStaffFilter={() => {}} // Não usado
          hideStaffFilter={true} // Esconder filtro
        />
      )}
    </div>
  )
}
