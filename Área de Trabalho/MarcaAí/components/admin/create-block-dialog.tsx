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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createBlock } from '@/lib/actions/schedule-blocks'
import { Loader2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CreateBlockDialogProps {
  businessId: string
  staff: Array<{ id: string; name: string }>
  services: Array<{ id: string; name: string }>
}

export function CreateBlockDialog({ businessId, staff, services }: CreateBlockDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    blockType: 'one_time' as 'one_time' | 'recurring',
    reason: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    allDay: false,
    staffId: '',
    serviceId: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createBlock(businessId, {
      blockType: formData.blockType,
      reason: formData.reason,
      startDate: formData.startDate,
      endDate: formData.endDate,
      startTime: formData.allDay ? undefined : formData.startTime,
      endTime: formData.allDay ? undefined : formData.endTime,
      allDay: formData.allDay,
      staffId: formData.staffId === 'all' ? undefined : formData.staffId,
      serviceId: formData.serviceId === 'all' ? undefined : formData.serviceId,
      recurrencePattern: formData.blockType === 'recurring' ? {} : undefined,
    })

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: result.message || 'Bloqueio criado com sucesso',
      })
      setOpen(false)
      setFormData({
        blockType: 'one_time',
        reason: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        allDay: false,
        staffId: 'all',
        serviceId: 'all',
      })
      router.refresh()
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Erro ao criar bloqueio',
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Bloqueio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Bloqueio de Horário</DialogTitle>
          <DialogDescription>
            Bloqueie horários para férias, feriados, reuniões ou outros eventos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo de Bloqueio</Label>
            <Select
              value={formData.blockType}
              onValueChange={(value: any) => setFormData({ ...formData, blockType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">Único</SelectItem>
                <SelectItem value="recurring">Recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Férias, Feriado, Reunião..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Dia inteiro checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allDay"
              checked={formData.allDay}
              onCheckedChange={(checked) => setFormData({ ...formData, allDay: checked as boolean })}
              disabled={loading}
            />
            <Label htmlFor="allDay" className="cursor-pointer">
              Dia inteiro
            </Label>
          </div>

          {/* Horários */}
          {!formData.allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Hora Inicial</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Hora Final</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Funcionário */}
          <div className="space-y-2">
            <Label>Funcionário (Opcional)</Label>
            <Select
              value={formData.staffId}
              onValueChange={(value) => setFormData({ ...formData, staffId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os funcionários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os funcionários</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Serviço */}
          <div className="space-y-2">
            <Label>Serviço (Opcional)</Label>
            <Select
              value={formData.serviceId}
              onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os serviços" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Bloqueio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
