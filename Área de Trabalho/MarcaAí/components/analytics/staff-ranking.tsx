'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

interface StaffPerformance {
  staffId: string
  staffName: string
  totalAppointments: number
  revenue: number
  averageRating: number | null
}

interface StaffRankingProps {
  data: StaffPerformance[]
  currency?: string
}

export function StaffRanking({ data, currency = 'EUR' }: StaffRankingProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency,
    }).format(value)
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Funcionários Destaque</CardTitle>
        <CardDescription>Top 5 funcionários por número de atendimentos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum dado disponível
            </p>
          ) : (
            data.map((staff, index) => (
              <div key={staff.staffId} className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="ml-4 space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">
                    {staff.staffName}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {staff.totalAppointments} atendimentos · {formatCurrency(staff.revenue)}
                    </p>
                    {staff.averageRating && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {staff.averageRating.toFixed(1)}
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
