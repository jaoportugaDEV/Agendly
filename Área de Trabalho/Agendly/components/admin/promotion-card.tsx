'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Pencil, Trash2 } from 'lucide-react'
import { togglePromotionStatus } from '@/lib/actions/promotions'
import { useToast } from '@/hooks/use-toast'
import { Promotion } from '@/types/shared'
import {
  formatWeekdays,
  formatPromotionPeriod,
  getWeekdayAbbrev,
  getPromotionStatus,
} from '@/lib/utils/promotions'
import { PromotionFormDialog } from './promotion-form-dialog'
import { DeletePromotionDialog } from './delete-promotion-dialog'

interface PromotionCardProps {
  promotion: Promotion
  currency: string
  services: Array<{ id: string; name: string; price: number }>
  packages: Array<{ id: string; name: string; final_price: number }>
  businessId: string
  targetName?: string
}

export function PromotionCard({
  promotion,
  currency,
  services,
  packages,
  businessId,
  targetName,
}: PromotionCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [switching, setSwitching] = useState(false)

  const status = getPromotionStatus(promotion)
  const typeLabel = promotion.promotion_type === 'service' ? 'Serviço' : 'Pacote'

  // Buscar nome do serviço/pacote se não foi fornecido
  const displayName =
    targetName ||
    (promotion.promotion_type === 'service'
      ? services.find((s) => s.id === promotion.target_id)?.name
      : packages.find((p) => p.id === promotion.target_id)?.name) ||
    'Não encontrado'

  const handleToggle = async (checked: boolean) => {
    setSwitching(true)

    const result = await togglePromotionStatus(promotion.id, checked)

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: `Promoção ${checked ? 'ativada' : 'desativada'} com sucesso`,
      })
      router.refresh()
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Erro ao alterar status da promoção',
        variant: 'destructive',
      })
    }

    setSwitching(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={promotion.promotion_type === 'service' ? 'default' : 'secondary'}>
                {typeLabel}
              </Badge>
              <Badge
                variant={
                  status.status === 'active'
                    ? 'default'
                    : status.status === 'expired'
                    ? 'destructive'
                    : status.status === 'scheduled'
                    ? 'outline'
                    : 'secondary'
                }
              >
                {status.label}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg">{promotion.name}</h3>
            <p className="text-sm text-muted-foreground">{displayName}</p>
          </div>
          <Switch
            checked={promotion.active}
            onCheckedChange={handleToggle}
            disabled={switching}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Descrição */}
        {promotion.description && (
          <p className="text-sm text-muted-foreground">{promotion.description}</p>
        )}

        {/* Preços */}
        <div className="flex items-center gap-2 text-lg">
          <span className="text-muted-foreground line-through">
            {currency} {promotion.original_price.toFixed(2)}
          </span>
          <span className="font-bold text-primary">→</span>
          <span className="font-bold text-primary">
            {currency} {promotion.promotional_price.toFixed(2)}
          </span>
          <Badge variant="destructive" className="ml-2">
            {Math.round(promotion.discount_percentage)}% OFF
          </Badge>
        </div>

        {/* Dias da Semana */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Dias:</p>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const isActive = promotion.weekdays.includes(day)
              return (
                <div
                  key={day}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {getWeekdayAbbrev(day)}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatWeekdays(promotion.weekdays)}
          </p>
        </div>

        {/* Período */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Válido:</p>
          <p className="text-sm text-muted-foreground">
            {formatPromotionPeriod(promotion)}
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <PromotionFormDialog
            businessId={businessId}
            services={services}
            packages={packages}
            currency={currency}
            promotion={promotion}
            trigger={
              <Button variant="outline" size="sm" className="flex-1">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            }
          />
          <DeletePromotionDialog
            promotionId={promotion.id}
            promotionName={promotion.name}
            trigger={
              <Button variant="outline" size="sm" className="flex-1">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
