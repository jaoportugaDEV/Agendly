'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { format, addMinutes, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface ReschedulePickerProps {
  appointment: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (newStartTime: string, newEndTime: string) => Promise<void>
  businessId: string
}

export function ReschedulePicker({
  appointment,
  open,
  onOpenChange,
  onConfirm,
  businessId,
}: ReschedulePickerProps) {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Buscar horários disponíveis quando a data mudar
  useEffect(() => {
    if (!selectedDate || !appointment || !open) return

    const fetchAvailableSlots = async () => {
      setLoading(true)
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const response = await fetch(
          `/api/appointments/available-slots?businessId=${businessId}&date=${dateStr}&staffId=${appointment.staff_id}&serviceId=${appointment.service_id}&excludeId=${appointment.id}`
        )

        if (!response.ok) throw new Error('Erro ao buscar horários')

        const data = await response.json()
        setAvailableSlots(data.slots || [])
      } catch (error) {
        console.error('Erro:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os horários disponíveis',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableSlots()
  }, [selectedDate, appointment, businessId, open, toast])

  const handleSelectSlot = async (slot: string) => {
    if (!appointment) return
    setConfirming(true)

    try {
      const startTime = parseISO(`${format(selectedDate!, 'yyyy-MM-dd')}T${slot}`)
      const endTime = addMinutes(startTime, appointment.service?.duration_minutes || 60)

      await onConfirm(startTime.toISOString(), endTime.toISOString())
      
      toast({
        title: 'Reagendado com sucesso',
        description: `Novo horário: ${format(startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível reagendar',
        variant: 'destructive',
      })
    } finally {
      setConfirming(false)
    }
  }

  if (!appointment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Reagendar Agendamento</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendário */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Selecione a Data</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
          </div>

          {/* Horários Disponíveis */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Horários Disponíveis</h3>
              {selectedDate && (
                <p className="text-sm text-muted-foreground mb-4">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum horário disponível nesta data
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant="outline"
                      onClick={() => handleSelectSlot(slot)}
                      disabled={confirming}
                      className="h-12 hover:bg-primary hover:text-primary-foreground"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {slot}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Info do Serviço */}
            <div className="pt-4 border-t">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviço:</span>
                  <span className="font-medium">{appointment.service?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração:</span>
                  <Badge variant="secondary">{appointment.service?.duration_minutes} min</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
