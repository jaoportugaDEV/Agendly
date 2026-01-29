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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPromotion, updatePromotion } from '@/lib/actions/promotions'
import { calculateDiscount, getWeekdayAbbrev } from '@/lib/utils/promotions'
import { Loader2, Plus, Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Promotion } from '@/types/shared'

interface PromotionFormDialogProps {
  businessId: string
  services: Array<{ id: string; name: string; price: number }>
  packages: Array<{ id: string; name: string; final_price: number }>
  currency: string
  promotion?: Promotion
  trigger?: React.ReactNode
}

const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

export function PromotionFormDialog({
  businessId,
  services,
  packages,
  currency,
  promotion,
  trigger,
}: PromotionFormDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const isEditing = !!promotion

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    promotionType: 'service' as 'service' | 'package',
    targetId: '',
    promotionalPrice: '',
    originalPrice: 0,
    weekdays: [] as number[],
    recurrenceType: 'recurring' as 'recurring' | 'date_range',
    startDate: '',
    endDate: '',
    active: true,
  })

  // Preencher dados se estiver editando
  useEffect(() => {
    if (promotion && open) {
      setFormData({
        name: promotion.name,
        description: promotion.description || '',
        promotionType: promotion.promotion_type,
        targetId: promotion.target_id,
        promotionalPrice: promotion.promotional_price.toString(),
        originalPrice: promotion.original_price,
        weekdays: promotion.weekdays,
        recurrenceType: promotion.recurrence_type,
        startDate: promotion.start_date || '',
        endDate: promotion.end_date || '',
        active: promotion.active,
      })
    }
  }, [promotion, open])

  // Atualizar preço original quando selecionar serviço/pacote
  useEffect(() => {
    if (formData.targetId) {
      if (formData.promotionType === 'service') {
        const service = services.find((s) => s.id === formData.targetId)
        if (service) {
          setFormData((prev) => ({ ...prev, originalPrice: service.price }))
        }
      } else {
        const pkg = packages.find((p) => p.id === formData.targetId)
        if (pkg) {
          setFormData((prev) => ({ ...prev, originalPrice: pkg.final_price }))
        }
      }
    }
  }, [formData.targetId, formData.promotionType, services, packages])

  const discount = calculateDiscount(
    formData.originalPrice,
    parseFloat(formData.promotionalPrice) || 0
  )

  const handleWeekdayToggle = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter((d) => d !== day)
        : [...prev.weekdays, day].sort((a, b) => a - b),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validações
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da promoção é obrigatório',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (!formData.targetId) {
      toast({
        title: 'Erro',
        description: `Selecione um ${formData.promotionType === 'service' ? 'serviço' : 'pacote'}`,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (formData.weekdays.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um dia da semana',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    const promotionalPrice = parseFloat(formData.promotionalPrice)
    if (isNaN(promotionalPrice) || promotionalPrice <= 0) {
      toast({
        title: 'Erro',
        description: 'Preço promocional inválido',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (promotionalPrice >= formData.originalPrice) {
      toast({
        title: 'Erro',
        description: 'Preço promocional deve ser menor que o preço original',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (formData.recurrenceType === 'date_range') {
      if (!formData.startDate || !formData.endDate) {
        toast({
          title: 'Erro',
          description: 'Datas de início e fim são obrigatórias para período específico',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        toast({
          title: 'Erro',
          description: 'Data de fim deve ser posterior à data de início',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }
    }

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      promotionType: formData.promotionType,
      targetId: formData.targetId,
      promotionalPrice,
      originalPrice: formData.originalPrice,
      weekdays: formData.weekdays,
      recurrenceType: formData.recurrenceType,
      startDate: formData.recurrenceType === 'date_range' ? formData.startDate : undefined,
      endDate: formData.recurrenceType === 'date_range' ? formData.endDate : undefined,
      active: formData.active,
    }

    const result = isEditing
      ? await updatePromotion(promotion.id, data)
      : await createPromotion(businessId, data)

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: `Promoção ${isEditing ? 'atualizada' : 'criada'} com sucesso`,
      })
      setOpen(false)
      setFormData({
        name: '',
        description: '',
        promotionType: 'service',
        targetId: '',
        promotionalPrice: '',
        originalPrice: 0,
        weekdays: [],
        recurrenceType: 'recurring',
        startDate: '',
        endDate: '',
        active: true,
      })
      router.refresh()
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Erro ao criar promoção',
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  const targetItems =
    formData.promotionType === 'service' ? services : packages

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            {isEditing ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isEditing ? 'Editar' : 'Nova Promoção'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Promoção' : 'Criar Nova Promoção'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados da promoção' : 'Configure uma promoção para serviços ou pacotes por dia da semana'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Promoção *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Segunda Maluca"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a promoção"
              rows={2}
            />
          </div>

          {/* Tipo de Promoção */}
          <div className="space-y-2">
            <Label>Tipo de Promoção *</Label>
            <RadioGroup
              value={formData.promotionType}
              onValueChange={(value: 'service' | 'package') =>
                setFormData({ ...formData, promotionType: value, targetId: '' })
              }
              disabled={isEditing}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="service" id="type-service" />
                <Label htmlFor="type-service" className="font-normal cursor-pointer">
                  Serviço Individual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="package" id="type-package" />
                <Label htmlFor="type-package" className="font-normal cursor-pointer">
                  Pacote/Combo
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Seleção de Serviço/Pacote */}
          <div className="space-y-2">
            <Label htmlFor="target">
              {formData.promotionType === 'service' ? 'Serviço' : 'Pacote'} *
            </Label>
            <Select
              value={formData.targetId}
              onValueChange={(value) => setFormData({ ...formData, targetId: value })}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Selecione um ${formData.promotionType === 'service' ? 'serviço' : 'pacote'}`} />
              </SelectTrigger>
              <SelectContent>
                {targetItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({currency} {(formData.promotionType === 'service' ? item.price : (item as any).final_price).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preços */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preço Original</Label>
              <Input
                value={formData.originalPrice > 0 ? `${currency} ${formData.originalPrice.toFixed(2)}` : '---'}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promotionalPrice">Preço Promocional *</Label>
              <Input
                id="promotionalPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.promotionalPrice}
                onChange={(e) =>
                  setFormData({ ...formData, promotionalPrice: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Desconto calculado */}
          {discount > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Desconto: {discount}% OFF
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                Economia de {currency} {(formData.originalPrice - parseFloat(formData.promotionalPrice || '0')).toFixed(2)}
              </p>
            </div>
          )}

          {/* Dias da Semana */}
          <div className="space-y-2">
            <Label>Dias da Semana *</Label>
            <div className="grid grid-cols-7 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <div key={day} className="flex flex-col items-center gap-1">
                  <Checkbox
                    id={`day-${day}`}
                    checked={formData.weekdays.includes(day)}
                    onCheckedChange={() => handleWeekdayToggle(day)}
                  />
                  <Label
                    htmlFor={`day-${day}`}
                    className="text-xs font-normal cursor-pointer"
                  >
                    {getWeekdayAbbrev(day)}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {WEEKDAY_NAMES[day].substring(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tipo de Recorrência */}
          <div className="space-y-2">
            <Label>Período *</Label>
            <RadioGroup
              value={formData.recurrenceType}
              onValueChange={(value: 'recurring' | 'date_range') =>
                setFormData({ ...formData, recurrenceType: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="recurring" id="recur-recurring" />
                <Label htmlFor="recur-recurring" className="font-normal cursor-pointer">
                  Recorrente (sempre nos dias selecionados)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date_range" id="recur-range" />
                <Label htmlFor="recur-range" className="font-normal cursor-pointer">
                  Período específico
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Datas de início e fim (apenas para date_range) */}
          {formData.recurrenceType === 'date_range' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Fim *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Status Inicial */}
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="space-y-0.5">
              <Label htmlFor="active">Status da Promoção</Label>
              <p className="text-sm text-muted-foreground">
                {formData.active ? 'Promoção ativa' : 'Promoção inativa'}
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, active: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Atualizar' : 'Criar'} Promoção
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
