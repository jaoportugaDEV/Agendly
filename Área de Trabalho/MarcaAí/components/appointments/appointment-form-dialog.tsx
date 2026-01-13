'use client'

import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CustomerSelect } from './customer-select'
import { createAppointment, updateAppointment } from '@/lib/actions/appointments'
import { useToast } from '@/components/ui/use-toast'

interface AppointmentFormDialogProps {
  businessId: string
  services: Array<{
    id: string
    name: string
    duration_minutes: number
    price: number
    currency: string
  }>
  staff: Array<{
    id: string
    users: {
      id: string
      full_name: string | null
      email: string
    }
  }>
  appointment?: any
  trigger?: React.ReactNode
  defaultDate?: string
  defaultStaffId?: string
}

export function AppointmentFormDialog({
  businessId,
  services,
  staff,
  appointment,
  trigger,
  defaultDate,
  defaultStaffId,
}: AppointmentFormDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [formData, setFormData] = useState({
    staffId: defaultStaffId || appointment?.staff_id || '',
    serviceId: appointment?.service_id || '',
    date: defaultDate || appointment?.start_time?.split('T')[0] || '',
    time: appointment?.start_time?.split('T')[1]?.substring(0, 5) || '',
    notes: appointment?.notes || '',
  })

  const isEditing = !!appointment

  useEffect(() => {
    if (appointment?.customer) {
      setSelectedCustomer(appointment.customer)
    }
  }, [appointment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCustomer) {
      toast({
        title: 'Erro',
        description: 'Selecione um cliente',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const startTime = `${formData.date}T${formData.time}:00`

      const data = {
        staffId: formData.staffId,
        customerId: selectedCustomer.id,
        serviceId: formData.serviceId,
        startTime,
        notes: formData.notes,
      }

      const result = isEditing
        ? await updateAppointment(appointment.id, data)
        : await createAppointment(businessId, data)

      if (result.success) {
        toast({
          title: isEditing ? 'Agendamento atualizado' : 'Agendamento criado',
          description: isEditing
            ? 'O agendamento foi atualizado com sucesso.'
            : 'O agendamento foi criado com sucesso.',
        })
        setOpen(false)
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

  const selectedService = services.find((s) => s.id === formData.serviceId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Atualize as informações do agendamento.'
                : 'Crie um novo agendamento para um cliente.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Cliente *</Label>
              <CustomerSelect
                businessId={businessId}
                onSelect={setSelectedCustomer}
                selectedCustomerId={selectedCustomer?.id}
              />
              {selectedCustomer && (
                <div className="text-sm text-muted-foreground">
                  {selectedCustomer.name} - {selectedCustomer.phone}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="serviceId">Serviço *</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, serviceId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {service.duration_minutes}min -{' '}
                      {new Intl.NumberFormat('pt-PT', {
                        style: 'currency',
                        currency: service.currency,
                      }).format(service.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="staffId">Profissional *</Label>
              <Select
                value={formData.staffId}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, staffId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.users.id} value={member.users.id}>
                      {member.users.full_name || member.users.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="time">Hora *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Observações opcionais"
              />
            </div>

            {selectedService && (
              <div className="rounded-lg border p-3 text-sm bg-muted">
                <div className="font-medium mb-1">Resumo</div>
                <div className="text-muted-foreground space-y-1">
                  <div>Duração: {selectedService.duration_minutes} minutos</div>
                  <div>
                    Valor:{' '}
                    {new Intl.NumberFormat('pt-PT', {
                      style: 'currency',
                      currency: selectedService.currency,
                    }).format(selectedService.price)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
