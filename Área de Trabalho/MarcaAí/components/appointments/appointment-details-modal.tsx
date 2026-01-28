'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Trash2,
  Save
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface AppointmentDetailsModalProps {
  appointment: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
  onReschedule: (appointment: any) => void
}

export function AppointmentDetailsModal({
  appointment,
  open,
  onOpenChange,
  onUpdate,
  onReschedule,
}: AppointmentDetailsModalProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Atualizar notes quando appointment mudar
  useState(() => {
    if (appointment) {
      setNotes(appointment.notes || '')
    }
  })

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      completed: 'Compareceu',
      cancelled: 'Cancelado',
      no_show: 'Não Compareceu',
    }
    return labels[status] || status
  }

  const getStatusVariant = (status: string): any => {
    const variants: Record<string, any> = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'default',
      cancelled: 'destructive',
      no_show: 'destructive',
    }
    return variants[status] || 'secondary'
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) return
    setLoading(true)

    try {
      const response = await fetch(`/api/appointments/${appointment.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar status')

      toast({
        title: 'Status atualizado',
        description: `Agendamento marcado como ${getStatusLabel(newStatus)}`,
      })

      await onUpdate()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!appointment) return
    setLoading(true)

    try {
      const response = await fetch(`/api/appointments/${appointment.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) throw new Error('Erro ao salvar observações')

      toast({
        title: 'Observações salvas',
        description: 'As observações foram atualizadas com sucesso',
      })

      await onUpdate()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as observações',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!appointment || !confirm('Tem certeza que deseja excluir este agendamento?')) return
    setLoading(true)

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir')

      toast({
        title: 'Agendamento excluído',
        description: 'O agendamento foi removido com sucesso',
      })

      onOpenChange(false)
      await onUpdate()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o agendamento',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!appointment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Info do Cliente */}
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-semibold">{appointment.customer?.name || 'N/A'}</p>
                {appointment.customer?.phone && (
                  <p className="text-sm text-muted-foreground">{appointment.customer.phone}</p>
                )}
              </div>
            </div>

            {/* Info do Serviço */}
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
              <Scissors className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Serviço</p>
                <p className="font-semibold">{appointment.service?.name || 'N/A'}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>{appointment.service?.duration_minutes} min</span>
                  <span>R$ {appointment.service?.price?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Horário */}
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Data e Horário</p>
                <p className="font-semibold">
                  {format(new Date(appointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReschedule(appointment)}
                disabled={loading}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Reagendar
              </Button>
            </div>

            {/* Status Atual */}
            <div className="space-y-3">
              <Label>Status Atual</Label>
              <Badge variant={getStatusVariant(appointment.status)} className="text-sm">
                {getStatusLabel(appointment.status)}
              </Badge>
            </div>

            {/* Ações de Status */}
            <div className="space-y-3">
              <Label>Alterar Status</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={loading || appointment.status === 'confirmed'}
                  className="justify-start border-blue-200 hover:bg-blue-50"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                  Confirmado
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('completed')}
                  disabled={loading || appointment.status === 'completed'}
                  className="justify-start border-green-200 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                  Compareceu
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('no_show')}
                  disabled={loading || appointment.status === 'no_show'}
                  className="justify-start border-orange-200 hover:bg-orange-50"
                >
                  <AlertCircle className="h-4 w-4 mr-2 text-orange-600" />
                  Não Compareceu
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={loading || appointment.status === 'cancelled'}
                  className="justify-start border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                  Cancelar
                </Button>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-3">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre este agendamento..."
                rows={4}
                disabled={loading}
              />
              <Button
                onClick={handleSaveNotes}
                disabled={loading || notes === (appointment.notes || '')}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Observações
              </Button>
            </div>

            {/* Excluir */}
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Agendamento
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
