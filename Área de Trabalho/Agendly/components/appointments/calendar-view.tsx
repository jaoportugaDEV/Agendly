'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Calendar, User } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS } from '@/types/shared'

interface CalendarViewProps {
  appointments: any[]
  staff: Array<{
    id: string
    users: {
      id: string
      full_name: string | null
      email: string
    }
  }>
  onDateChange: (date: Date) => void
  onStaffFilter: (staffId: string | null) => void
}

export function CalendarView({
  appointments,
  staff,
  onDateChange,
  onStaffFilter,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-PT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + days)
    setCurrentDate(newDate)
    onDateChange(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onDateChange(today)
  }

  const handleStaffFilter = (staffId: string) => {
    const newStaffId = staffId === 'all' ? null : staffId
    setSelectedStaffId(newStaffId)
    onStaffFilter(newStaffId)
  }

  const getWeekDays = () => {
    const start = new Date(currentDate)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Ajustar para segunda-feira
    start.setDate(diff)

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return date
    })
  }

  const filterAppointmentsByDate = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.start_time)
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate()
      )
    })
  }

  const getDayAppointments = () => {
    return filterAppointmentsByDate(currentDate).sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
  }

  const getWeekAppointments = () => {
    const weekDays = getWeekDays()
    return weekDays.map((date) => ({
      date,
      appointments: filterAppointmentsByDate(date),
    }))
  }

  const dayAppointments = viewMode === 'day' ? getDayAppointments() : []
  const weekData = viewMode === 'week' ? getWeekAppointments() : []

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => changeDate(viewMode === 'day' ? -1 : -7)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => changeDate(viewMode === 'day' ? 1 : 7)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedStaffId || 'all'}
            onValueChange={handleStaffFilter}
          >
            <SelectTrigger className="w-[200px]">
              <User className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Todos profissionais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos profissionais</SelectItem>
              {staff.map((member) => (
                <SelectItem key={member.users.id} value={member.users.id}>
                  {member.users.full_name || member.users.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={viewMode}
            onValueChange={(value: 'day' | 'week') => setViewMode(value)}
          >
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data atual */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">{formatDate(currentDate)}</h2>
      </div>

      {/* Visualização por dia */}
      {viewMode === 'day' && (
        <div className="space-y-3">
          {dayAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  Nenhum agendamento neste dia.
                </p>
              </CardContent>
            </Card>
          ) : (
            dayAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-lg font-bold">
                        {formatTime(appointment.start_time)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {appointment.service?.duration_minutes}min
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">
                            {appointment.customer?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.service?.name}
                          </div>
                        </div>
                        <Badge
                          className={
                            STATUS_COLORS[
                              appointment.status as keyof typeof STATUS_COLORS
                            ]
                          }
                        >
                          {
                            STATUS_LABELS[
                              appointment.status as keyof typeof STATUS_LABELS
                            ]
                          }
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.staff?.full_name || appointment.staff?.email}
                      </div>
                      {appointment.notes && (
                        <div className="text-sm pt-1 border-t mt-2">
                          {appointment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Visualização por semana */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekData.map(({ date, appointments }) => {
            const isToday =
              date.toDateString() === new Date().toDateString()
            return (
              <Card
                key={date.toISOString()}
                className={isToday ? 'ring-2 ring-primary' : ''}
              >
                <CardContent className="p-3">
                  <div className="text-center mb-2">
                    <div className="text-sm font-medium">
                      {new Intl.DateTimeFormat('pt-PT', {
                        weekday: 'short',
                      }).format(date)}
                    </div>
                    <div
                      className={`text-xl font-bold ${
                        isToday ? 'text-primary' : ''
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {appointments.length === 0 ? (
                      <div className="text-xs text-center text-muted-foreground py-2">
                        Sem agendamentos
                      </div>
                    ) : (
                      appointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="text-xs p-2 rounded bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                          <div className="font-medium truncate">
                            {formatTime(apt.start_time)}
                          </div>
                          <div className="truncate text-muted-foreground">
                            {apt.customer?.name}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
