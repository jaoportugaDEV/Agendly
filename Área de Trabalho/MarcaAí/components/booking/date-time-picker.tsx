'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar, Clock, Loader2 } from 'lucide-react'
import type { TimeSlot } from '@/types/shared'
import { getAvailableSlots, getAvailableSlotsAnyStaff } from '@/lib/actions/availability'

interface DateTimePickerProps {
  businessId: string
  serviceId: string
  staffId: string
  selectedDateTime: string | null
  onSelect: (datetime: string) => void
}

export function DateTimePicker({
  businessId,
  serviceId,
  staffId,
  selectedDateTime,
  onSelect,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date())

  // Initialize with today's date
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const monday = new Date(today)
    const day = monday.getDay()
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    monday.setDate(diff)
    setCurrentWeekStart(monday)
    
    // Set today as initial selected date
    const todayStr = formatDate(today)
    setSelectedDate(todayStr)
  }, [])

  // Load slots when date or staff changes
  useEffect(() => {
    if (selectedDate && serviceId) {
      loadSlots()
    }
  }, [selectedDate, serviceId, staffId, businessId])

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return new Intl.DateTimeFormat('pt-PT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date)
  }

  const loadSlots = async () => {
    setLoading(true)
    try {
      const result =
        staffId === 'any'
          ? await getAvailableSlotsAnyStaff({
              businessId,
              serviceId,
              date: selectedDate,
            })
          : await getAvailableSlots({
              businessId,
              serviceId,
              staffId,
              date: selectedDate,
            })

      if (result.success && result.data) {
        setAvailableSlots(result.data)
      } else {
        setAvailableSlots([])
      }
    } catch (error) {
      console.error('Error loading slots:', error)
      setAvailableSlots([])
    } finally {
      setLoading(false)
    }
  }

  const getDatesInWeek = () => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(date.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeekStart)
    newWeek.setDate(newWeek.getDate() - 7)
    
    // Don't go to past weeks
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const monday = new Date(today)
    const day = monday.getDay()
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
    monday.setDate(diff)
    
    if (newWeek >= monday) {
      setCurrentWeekStart(newWeek)
    }
  }

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeekStart)
    newWeek.setDate(newWeek.getDate() + 7)
    
    // Limit to 30 days in the future
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    
    if (newWeek <= maxDate) {
      setCurrentWeekStart(newWeek)
    }
  }

  const canGoPrevious = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const monday = new Date(today)
    const day = monday.getDay()
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
    monday.setDate(diff)
    
    const prevWeek = new Date(currentWeekStart)
    prevWeek.setDate(prevWeek.getDate() - 7)
    
    return prevWeek >= monday
  }

  const canGoNext = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    
    const nextWeek = new Date(currentWeekStart)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    return nextWeek <= maxDate
  }

  const weekDates = getDatesInWeek()
  const availableTimeSlots = availableSlots.filter((slot) => slot.available)

  return (
    <div className="space-y-6">
      {/* Calendar Week Selector */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Escolha a data
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              disabled={!canGoPrevious()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              disabled={!canGoNext()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date) => {
            const dateStr = formatDate(date)
            const isSelected = selectedDate === dateStr
            const isToday =
              formatDate(new Date()) === dateStr
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

            return (
              <Button
                key={dateStr}
                variant={isSelected ? 'default' : 'outline'}
                className="flex flex-col h-auto py-3"
                onClick={() => setSelectedDate(dateStr)}
                disabled={isPast}
              >
                <span className="text-xs uppercase">
                  {date.toLocaleDateString('pt-PT', { weekday: 'short' })}
                </span>
                <span className="text-lg font-bold">{date.getDate()}</span>
                {isToday && (
                  <span className="text-xs text-muted-foreground">Hoje</span>
                )}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Escolha o horário - {formatDateDisplay(selectedDate)}
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : availableTimeSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {availableTimeSlots.map((slot) => {
                const isSelected = selectedDateTime === slot.datetime
                
                return (
                  <Button
                    key={slot.time}
                    variant={isSelected ? 'default' : 'outline'}
                    className="h-auto py-3"
                    onClick={() => onSelect(slot.datetime)}
                  >
                    {slot.time}
                  </Button>
                )
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Não há horários disponíveis neste dia.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Tente selecionar outro dia.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
