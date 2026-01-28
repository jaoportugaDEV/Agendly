'use client'

import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, User, Briefcase, Users, Mail, Phone } from 'lucide-react'
import type { PublicServiceData, PublicStaffData } from '@/types/shared'

interface BookingSummaryProps {
  service: PublicServiceData
  staff: PublicStaffData | 'any'
  dateTime: string
  customer: {
    name: string
    email: string
    phone: string
    notes: string
  }
  currency: string
}

export function BookingSummary({
  service,
  staff,
  dateTime,
  customer,
  currency,
}: BookingSummaryProps) {
  const formatPrice = (price: number, curr: string) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: curr,
    }).format(price)
  }

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime)
    return {
      date: date.toLocaleDateString('pt-PT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const { date, time } = formatDateTime(dateTime)

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Resumo do Agendamento</h3>

      <div className="space-y-4">
        {/* Service */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Serviço</p>
            <p className="font-semibold">{service.name}</p>
            <div className="flex items-baseline gap-2 text-sm">
              <span className="text-muted-foreground">
                {formatDuration(service.duration_minutes)} •{' '}
              </span>
              {service.promotion ? (
                <>
                  <span className="font-semibold text-primary">
                    {formatPrice(service.promotion.promotional_price, service.currency)}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(service.price, service.currency)}
                  </span>
                  <span className="text-xs font-medium text-green-600">
                    ({Math.round(service.promotion.discount_percentage)}% OFF)
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {formatPrice(service.price, service.currency)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Staff */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {staff === 'any' ? (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            ) : (
              <Avatar className="h-10 w-10">
                <AvatarImage src={staff.avatar_url} alt={staff.name} />
                <AvatarFallback>
                  {staff.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Profissional</p>
            <p className="font-semibold">
              {staff === 'any' ? 'Qualquer disponível' : staff.name}
            </p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Data</p>
            <p className="font-semibold capitalize">{date}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Horário</p>
            <p className="font-semibold">{time}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3">Seus Dados</h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{customer.name}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
            
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            
            {customer.notes && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground mb-1">Observações:</p>
                <p className="text-sm">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
