'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

interface ServicePerformance {
  serviceId: string
  serviceName: string
  totalAppointments: number
  revenue: number
  averageRating: number | null
}

interface ServicesRankingProps {
  data: ServicePerformance[]
  currency?: string
}

export function ServicesRanking({ data, currency = 'EUR' }: ServicesRankingProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency,
    }).format(value)
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Serviços Mais Agendados</CardTitle>
        <CardDescription>Top 5 serviços por número de agendamentos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum dado disponível
            </p>
          ) : (
            data.map((service, index) => (
              <div key={service.serviceId} className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="ml-4 space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">
                    {service.serviceName}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {service.totalAppointments} agendamentos · {formatCurrency(service.revenue)}
                    </p>
                    {service.averageRating && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {service.averageRating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
