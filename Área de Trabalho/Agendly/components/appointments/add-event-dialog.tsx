'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar, Ban } from 'lucide-react'

interface AddEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectType: (type: 'appointment' | 'block') => void
  selectedTime?: string
}

export function AddEventDialog({
  open,
  onOpenChange,
  onSelectType,
  selectedTime,
}: AddEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>O que deseja adicionar?</DialogTitle>
          {selectedTime && (
            <p className="text-sm text-muted-foreground">
              Horário selecionado: {selectedTime}
            </p>
          )}
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2 hover:bg-primary hover:text-primary-foreground"
            onClick={() => {
              onSelectType('appointment')
              onOpenChange(false)
            }}
          >
            <Calendar className="h-8 w-8" />
            <span className="font-semibold">Novo Agendamento</span>
            <span className="text-xs">Agendar serviço para cliente</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex-col gap-2 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => {
              onSelectType('block')
              onOpenChange(false)
            }}
          >
            <Ban className="h-8 w-8" />
            <span className="font-semibold">Horário Indisponível</span>
            <span className="text-xs">Bloquear horário (folga, almoço, etc)</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
