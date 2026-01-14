'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Coffee, HeartPulse, Clock } from 'lucide-react'
import { deactivateStaffMember } from '@/lib/actions/staff'
import { useToast } from '@/components/ui/use-toast'

interface DeactivateStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  member: {
    id: string
    users: {
      full_name: string | null
      email: string
    } | null
  }
}

const ABSENCE_REASONS = [
  { value: 'ferias', label: 'Férias', icon: Calendar },
  { value: 'folga', label: 'Folga / Dia de descanso', icon: Coffee },
  { value: 'doenca', label: 'Doença / Atestado médico', icon: HeartPulse },
  { value: 'outro', label: 'Outro motivo', icon: Clock },
]

export function DeactivateStaffDialog({
  open,
  onOpenChange,
  businessId,
  member,
}: DeactivateStaffDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um motivo para a ausência.',
        variant: 'destructive',
      })
      return
    }

    if (!startDate) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe a data de início da ausência.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const result = await deactivateStaffMember(businessId, member.id, {
        reason,
        startDate,
        endDate: endDate || null,
        notes: notes || null,
      })

      if (result.success) {
        toast({
          title: 'Funcionário desativado',
          description: `${member.users?.full_name || member.users?.email || 'Funcionário'} foi marcado como ausente.`,
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Marcar ausência de funcionário</DialogTitle>
          <DialogDescription>
            Configure o período e motivo da ausência de{' '}
            <strong>{member.users?.full_name || member.users?.email || 'este funcionário'}</strong>.
            Durante este período, o funcionário não aparecerá como disponível para
            novos agendamentos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Motivo */}
          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo da ausência *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {ABSENCE_REASONS.map((r) => {
                  const Icon = r.icon
                  return (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {r.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Data início */}
          <div className="grid gap-2">
            <Label htmlFor="startDate">Data de início *</Label>
            <Input
              id="startDate"
              type="date"
              min={getTodayDate()}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              A partir desta data, o funcionário ficará indisponível
            </p>
          </div>

          {/* Data fim */}
          <div className="grid gap-2">
            <Label htmlFor="endDate">
              Data de retorno <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="endDate"
              type="date"
              min={startDate || getTodayDate()}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Se informada, o funcionário será reativado automaticamente nesta data
            </p>
          </div>

          {/* Observações */}
          <div className="grid gap-2">
            <Label htmlFor="notes">
              Observações <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Ex: Férias aprovadas em reunião, retorno previsto..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Confirmar ausência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
