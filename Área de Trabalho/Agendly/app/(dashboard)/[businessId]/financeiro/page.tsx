import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { getFinancialStats, getStaffPerformance } from '@/lib/actions/payments'
import { getInstallmentsToReceive } from '@/lib/actions/payments'
import { getExpenses, getExpensesStats, getExpenseCategories } from '@/lib/actions/expenses'
import { FinancialDashboard } from '@/components/financial/financial-dashboard'
import { InstallmentsTable } from '@/components/financial/installments-table'
import { ExpensesTable } from '@/components/financial/expenses-table'
import { ExpenseFormDialog } from '@/components/financial/expense-form-dialog'
import { StaffPerformanceRanking } from '@/components/financial/staff-performance-ranking'
import { DateRangeSelector } from '@/components/financial/date-range-selector'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingDown, TrendingUp, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/country'

export default async function FinanceiroPage({
  params,
  searchParams,
}: {
  params: { businessId: string }
  searchParams?: { startDate?: string; endDate?: string }
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Verificar se é admin
  const { data: membership } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', params.businessId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    redirect(`/${params.businessId}`)
  }

  // Buscar moeda da empresa
  const { data: business } = await supabase
    .from('businesses')
    .select('country_code')
    .eq('id', params.businessId)
    .single()

  const currency = business?.country_code === 'PT' ? 'EUR' : 'BRL'

  // Período: usa searchParams ou padrão (mês atual)
  let startDate: Date
  let endDate: Date

  if (searchParams?.startDate && searchParams?.endDate) {
    startDate = new Date(searchParams.startDate)
    endDate = new Date(searchParams.endDate)
  } else {
    // Padrão: mês atual
    startDate = new Date()
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)
    
    endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
    endDate.setDate(0)
    endDate.setHours(23, 59, 59, 999)
  }

  const startDateStr = startDate.toISOString()
  const endDateStr = endDate.toISOString()

  // Buscar dados
  const [
    financialStatsResult, 
    installmentsResult, 
    expensesResult, 
    expenseStatsResult, 
    categoriesResult,
    staffPerformanceResult
  ] = await Promise.all([
    getFinancialStats(params.businessId, startDateStr, endDateStr),
    getInstallmentsToReceive(params.businessId),
    getExpenses(params.businessId, {
      startDate: startDateStr.split('T')[0],
      endDate: endDateStr.split('T')[0]
    }),
    getExpensesStats(params.businessId, startDateStr.split('T')[0], endDateStr.split('T')[0]),
    getExpenseCategories(params.businessId),
    getStaffPerformance(params.businessId, startDateStr, endDateStr)
  ])

  const financialStats = financialStatsResult.success ? financialStatsResult.data : null
  const installments = installmentsResult.success ? installmentsResult.data : []
  const expenses = expensesResult.success ? expensesResult.data : []
  const expenseStats = expenseStatsResult.success ? expenseStatsResult.data : null
  const categories = categoriesResult.success ? categoriesResult.data : []
  const staffPerformance = staffPerformanceResult.success ? staffPerformanceResult.data : []

  // Calcular lucro
  const totalRevenue = financialStats?.totalRevenue || 0
  const totalExpenses = expenseStats?.totalExpenses || 0
  const netProfit = totalRevenue - totalExpenses

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Gestão completa de receitas e despesas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeSelector 
            currentStartDate={startDateStr} 
            currentEndDate={endDateStr}
          />
          <ExpenseFormDialog businessId={params.businessId} categories={categories} />
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue, currency as any)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pagamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses, currency as any)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Despesas pagas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className={`h-4 w-4 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit, currency as any)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parcelas a Receber</CardTitle>
            <Clock className={`h-4 w-4 ${financialStats?.overdueCount ? 'text-red-600' : 'text-blue-600'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialStats?.overdueCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {financialStats?.overdueCount ? (
                <span className="text-red-600 font-medium">
                  {financialStats.overdueCount} vencida(s)
                </span>
              ) : (
                'Todas em dia'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="installments">
            Parcelas ({installments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="expenses">
            Despesas ({expenses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <FinancialDashboard
            businessId={params.businessId}
            currency={currency}
            stats={{
              totalRevenue,
              totalExpenses,
              netProfit,
              overdueInstallments: financialStats?.overdueCount || 0
            }}
          />

          {/* Ranking de Performance por Funcionário */}
          <StaffPerformanceRanking 
            performance={staffPerformance || []} 
            currency={currency}
          />
        </TabsContent>

        <TabsContent value="installments" className="mt-6">
          <InstallmentsTable installments={installments || []} currency={currency} />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <ExpensesTable expenses={expenses || []} currency={currency} />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Categorias de Despesas</CardTitle>
              <CardDescription>
                Gerencie categorias customizadas para organizar suas despesas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma categoria customizada criada ainda
                </p>
              ) : (
                <div className="grid gap-2">
                  {categories.map((cat: any) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{cat.name}</p>
                        {cat.description && (
                          <p className="text-sm text-muted-foreground">{cat.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
