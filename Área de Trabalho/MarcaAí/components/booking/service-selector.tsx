'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { PublicServiceData } from '@/types/shared'
import { Check } from 'lucide-react'
import { PromotionBadge } from './promotion-badge'
import { formatWeekdays } from '@/lib/utils/promotions'

interface ServiceSelectorProps {
  services: PublicServiceData[]
  selectedServiceId: string | null
  onSelect: (serviceId: string) => void
  currency: string
}

export function ServiceSelector({
  services,
  selectedServiceId,
  onSelect,
  currency,
}: ServiceSelectorProps) {
  const formatPrice = (price: number, curr: string) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: curr,
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Nenhum serviço disponível no momento.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <Card
          key={service.id}
          className={`p-4 cursor-pointer transition-all hover:shadow-md relative ${
            selectedServiceId === service.id
              ? 'ring-2 ring-primary'
              : ''
          }`}
          onClick={() => onSelect(service.id)}
        >
          {/* Promotion Badge */}
          {service.promotion && (
            <div className="absolute top-2 right-2">
              <PromotionBadge discount={service.promotion.discount_percentage} />
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
              {service.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {service.description}
                </p>
              )}
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">
                  Duração: {formatDuration(service.duration_minutes)}
                </span>
                
                {/* Price with promotion */}
                <div className="flex items-baseline gap-2">
                  {service.promotion ? (
                    <>
                      <span className="font-semibold text-lg text-primary">
                        {formatPrice(service.promotion.promotional_price, service.currency)}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(service.price, service.currency)}
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold text-primary">
                      {formatPrice(service.price, service.currency)}
                    </span>
                  )}
                </div>

                {/* Promotion validity */}
                {service.promotion && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Válido: {formatWeekdays(service.promotion.weekdays).toLowerCase()}
                  </p>
                )}
              </div>
            </div>
            {selectedServiceId === service.id && (
              <div className="ml-2 flex-shrink-0">
                <div className="rounded-full bg-primary p-1">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
