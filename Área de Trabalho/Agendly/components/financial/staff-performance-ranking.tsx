'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/country'
import { getAvatarInitials } from '@/lib/validations/avatar'

interface StaffPerformance {
  staffId: string
  staffName: string
  avatarUrl?: string
  totalRevenue: number
  appointmentCount: number
  averageTicket: number
}

interface StaffPerformanceRankingProps {
  performance: StaffPerformance[]
  currency: string
}

export function StaffPerformanceRanking({ performance, currency }: StaffPerformanceRankingProps) {
  if (performance.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Nenhum dado disponível</p>
          <p className="text-sm text-muted-foreground">
            Não há agendamentos finalizados no período selecionado
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <CardTitle>Ranking de Performance</CardTitle>
        </div>
        <CardDescription>
          Receita por colaborador no período selecionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performance.map((staff, index) => {
            const isTop3 = index < 3
            const rankColors = ['text-yellow-600', 'text-gray-400', 'text-amber-600']
            const rankBgColors = ['bg-yellow-50 dark:bg-yellow-950/20', 'bg-gray-50 dark:bg-gray-950/20', 'bg-amber-50 dark:bg-amber-950/20']

            return (
              <div
                key={staff.staffId}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border',
                  isTop3 && rankBgColors[index]
                )}
              >
                {/* Posição */}
                <div className="flex items-center justify-center w-8">
                  {isTop3 ? (
                    <Trophy className={cn('h-6 w-6', rankColors[index])} />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                  )}
                </div>

                {/* Avatar e Nome */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={staff.avatarUrl} alt={staff.staffName} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {getAvatarInitials(staff.staffName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base">{staff.staffName}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {staff.appointmentCount} atendimento{staff.appointmentCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Ticket médio: {formatCurrency(staff.averageTicket, currency as any)}
                    </span>
                  </div>
                </div>

                {/* Receita Total */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(staff.totalRevenue, currency as any)}
                  </div>
                  {isTop3 && (
                    <Badge variant="secondary" className="mt-1">
                      Top {index + 1}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Resumo Total */}
        {performance.length > 1 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total da Equipe:</span>
              <span className="text-lg font-bold">
                {formatCurrency(
                  performance.reduce((sum, s) => sum + s.totalRevenue, 0),
                  currency as any
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
