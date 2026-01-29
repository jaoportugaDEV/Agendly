'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/country'

interface FinancialDashboardProps {
  businessId: string
  currency: string
  stats: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    overdueInstallments: number
  }
}

export function FinancialDashboard({ businessId, currency, stats }: FinancialDashboardProps) {
  const profitMargin = stats.totalRevenue > 0 
    ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro do Mês</CardTitle>
          <CardDescription>
            Visão geral das finanças da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Receitas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Receitas
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue, currency as any)}
              </span>
            </div>
            <div className="h-2 bg-green-100 dark:bg-green-950/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600 transition-all"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Despesas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Despesas
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-red-600">
                {formatCurrency(stats.totalExpenses, currency as any)}
              </span>
            </div>
            <div className="h-2 bg-red-100 dark:bg-red-950/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600 transition-all"
                style={{ 
                  width: stats.totalRevenue > 0 
                    ? `${Math.min((stats.totalExpenses / stats.totalRevenue) * 100, 100)}%`
                    : '0%'
                }}
              />
            </div>
          </div>

          {/* Lucro */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className={`h-5 w-5 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm font-medium">Lucro Líquido</span>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.netProfit, currency as any)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Margem: {profitMargin}%
                </p>
              </div>
            </div>
          </div>

          {/* Alerta de Parcelas Vencidas */}
          {stats.overdueInstallments > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Atenção: {stats.overdueInstallments} parcela(s) vencida(s)
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    Verifique a aba "Parcelas" para mais detalhes
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dica */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>💡 Dica:</strong> Mantenha suas despesas sempre atualizadas para ter uma visão real do lucro do seu negócio.
            Use as abas acima para gerenciar parcelas a receber e despesas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
