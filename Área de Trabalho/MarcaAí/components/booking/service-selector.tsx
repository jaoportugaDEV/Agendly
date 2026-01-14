'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { PublicServiceData } from '@/types/shared'
import { Check } from 'lucide-react'

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
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            selectedServiceId === service.id
              ? 'ring-2 ring-primary'
              : ''
          }`}
          onClick={() => onSelect(service.id)}
        >
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
                <span className="font-semibold text-primary">
                  {formatPrice(service.price, service.currency)}
                </span>
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
