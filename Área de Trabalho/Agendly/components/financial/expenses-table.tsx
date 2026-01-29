'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { CheckCircle2, Circle, MoreVertical, Trash2, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { markExpenseAsPaid, deleteExpense } from '@/lib/actions/expenses'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils/country'
import { EXPENSE_TYPE_LABELS } from '@/types/shared'
import type { ExpenseType } from '@/types/shared'

interface ExpensesTableProps {
  expenses: any[]
  currency: string
}

export function ExpensesTable({ expenses, currency }: ExpensesTableProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Circle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Nenhuma despesa registrada</p>
          <p className="text-sm text-muted-foreground">
            Comece adicionando uma nova despesa
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleMarkAsPaid = async (expenseId: string) => {
    setLoadingId(expenseId)

    try {
      const result = await markExpenseAsPaid({ expenseId })

      if (result.success) {
        toast({
          title: 'Despesa paga!',
          description: result.message || 'Despesa marcada como paga',
        })
        router.refresh()
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível marcar como paga',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado',
        variant: 'destructive'
      })
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return

    setLoadingId(expenseId)

    try {
      const result = await deleteExpense(expenseId)

      if (result.success) {
        toast({
          title: 'Despesa excluída!',
          description: result.message || 'Despesa removida com sucesso',
        })
        router.refresh()
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível excluir',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado',
        variant: 'destructive'
      })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="grid gap-4">
      {expenses.map((expense) => (
        <Card key={expense.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              {/* Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start gap-3">
                  {expense.is_paid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{expense.description}</h4>
                      <Badge variant="outline">
                        {expense.category?.name || EXPENSE_TYPE_LABELS[expense.expense_type as ExpenseType]}
                      </Badge>
                      {expense.is_paid && (
                        <Badge className="bg-green-600">Paga</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Data: {format(new Date(expense.expense_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                      {expense.due_date && !expense.is_paid && (
                        <p className={new Date(expense.due_date) < new Date() ? 'text-red-600 font-medium' : ''}>
                          Vencimento: {format(new Date(expense.due_date), "dd/MM/yyyy")}
                          {new Date(expense.due_date) < new Date() && ' (Vencida)'}
                        </p>
                      )}
                      {expense.is_paid && expense.paid_at && (
                        <p className="text-green-600">
                          Paga em: {format(new Date(expense.paid_at), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      )}
                      {expense.is_recurring && (
                        <Badge variant="secondary" className="mt-1">
                          Recorrente ({expense.frequency === 'monthly' ? 'Mensal' : 'Anual'})
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Valor e Ações */}
              <div className="flex items-start gap-3">
                <div className="text-right">
                  <div className="text-xl font-bold text-red-600">
                    {formatCurrency(expense.amount, currency as any)}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={loadingId === expense.id}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!expense.is_paid && (
                      <DropdownMenuItem onClick={() => handleMarkAsPaid(expense.id)}>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                        Marcar como Paga
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDelete(expense.id)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {expense.notes && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground">{expense.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
