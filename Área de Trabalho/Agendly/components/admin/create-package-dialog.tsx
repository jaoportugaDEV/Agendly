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
import { Checkbox } from '@/components/ui/checkbox'
import { createPackage } from '@/lib/actions/packages'
import { Loader2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CreatePackageDialogProps {
  businessId: string
  services: Array<{ id: string; name: string; price: number; duration_minutes: number }>
  currency: string
}

export function CreatePackageDialog({ businessId, services, currency }: CreatePackageDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    packagePrice: '',
    validityDays: '',
    maxUses: '',
    selectedServices: [] as string[],
  })

  // Calcular preço original baseado nos serviços selecionados
  const originalPrice = formData.selectedServices.reduce((total, serviceId) => {
    const service = services.find(s => s.id === serviceId)
    return total + (service?.price || 0)
  }, 0)

  const discount = originalPrice > 0 && formData.packagePrice
    ? Math.round(((originalPrice - parseFloat(formData.packagePrice)) / originalPrice) * 100)
    : 0

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (formData.selectedServices.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um serviço',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    const packagePrice = parseFloat(formData.packagePrice)
    if (packagePrice >= originalPrice) {
      toast({
        title: 'Erro',
        description: 'Preço do pacote deve ser menor que o preço original',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    const result = await createPackage(businessId, {
      name: formData.name,
      description: formData.description || undefined,
      originalPrice,
      packagePrice,
      validityDays: formData.validityDays ? parseInt(formData.validityDays) : undefined,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
      serviceIds: formData.selectedServices,
    })

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: result.message || 'Pacote criado com sucesso',
      })
      setOpen(false)
      setFormData({
        name: '',
        description: '',
        packagePrice: '',
        validityDays: '',
        maxUses: '',
        selectedServices: [],
      })
      router.refresh()
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Erro ao criar pacote',
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency,
    }).format(value)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pacote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Pacote de Serviços</DialogTitle>
          <DialogDescription>
            Crie combos promocionais para oferecer aos seus clientes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Pacote *</Label>
            <Input
              id="name"
              placeholder="Ex: Pacote Completo, Combo Beleza..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o que está incluso neste pacote..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={2}
            />
          </div>

          {/* Serviços */}
          <div className="space-y-2">
            <Label>Serviços Inclusos *</Label>
            <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
              {services.map((service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={service.id}
                    checked={formData.selectedServices.includes(service.id)}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                    disabled={loading}
                  />
                  <label
                    htmlFor={service.id}
                    className="text-sm flex-1 cursor-pointer"
                  >
                    {service.name} - {formatCurrency(service.price)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Preços */}
          {originalPrice > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Preço Original (soma):</span>
                <span className="font-medium">{formatCurrency(originalPrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto:</span>
                  <span className="font-medium">-{discount}%</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="packagePrice">Preço do Pacote *</Label>
            <Input
              id="packagePrice"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.packagePrice}
              onChange={(e) => setFormData({ ...formData, packagePrice: e.target.value })}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Deve ser menor que {formatCurrency(originalPrice)}
            </p>
          </div>

          {/* Opções */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxUses">Máximo de Usos (Opcional)</Label>
              <Input
                id="maxUses"
                type="number"
                placeholder="Ex: 10"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Quantas vezes o cliente pode usar este pacote
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validityDays">Validade (Dias)</Label>
              <Input
                id="validityDays"
                type="number"
                placeholder="Ex: 90"
                value={formData.validityDays}
                onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Dias após compra para usar
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Pacote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
