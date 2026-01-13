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
import { createService, updateService } from '@/lib/actions/services'
import { useToast } from '@/components/ui/use-toast'

interface ServiceFormDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  businessId: string
  service?: {
    id: string
    name: string
    description?: string | null
    duration_minutes: number
    price: number
    currency: string
  }
  trigger?: React.ReactNode
}

export function ServiceFormDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  businessId,
  service,
  trigger,
}: ServiceFormDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    durationMinutes: service?.duration_minutes || 30,
    price: service?.price || 0,
  })

  const isEditing = !!service
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const onOpenChange = controlledOnOpenChange || setInternalOpen

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = isEditing
        ? await updateService(service.id, formData)
        : await createService(businessId, formData)

      if (result.success) {
        toast({
          title: isEditing ? 'Serviço atualizado' : 'Serviço criado',
          description: isEditing
            ? 'O serviço foi atualizado com sucesso.'
            : 'O serviço foi criado com sucesso.',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Atualize as informações do serviço.'
                : 'Adicione um novo serviço ao seu negócio.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Serviço *</Label>
              <Input
                id="name"
                placeholder="Ex: Corte de Cabelo"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Descrição opcional do serviço"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duração (minutos) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationMinutes: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">
                  Preço ({service?.currency || 'EUR'}) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
