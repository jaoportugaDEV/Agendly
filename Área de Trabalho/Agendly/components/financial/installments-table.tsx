'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, CheckCircle2, Clock, DollarSign, User, Calendar as CalendarIcon } from 'lucide-react'
import { format, isPast, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { confirmInstallment } from '@/lib/actions/payments'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils/country'
import { getAvatarInitials } from '@/lib/validations/avatar'

interface InstallmentsTableProps {
  installments: any[]
  currency: string
}

export function InstallmentsTable({ installments, currency }: InstallmentsTableProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (installments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-lg font-medium">Nenhuma parcela pendente</p>
          <p className="text-sm text-muted-foreground">
            Todas as parcelas foram pagas!
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleConfirmPayment = async (installmentId: string) => {
    setLoadingId(installmentId)

    try {
      const result = await confirmInstallment({ installmentId })

      if (result.success) {
        toast({
          title: 'Parcela confirmada!',
          description: result.message || 'Pagamento registrado com sucesso',
        })
        router.refresh()
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível confirmar o pagamento',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao confirmar pagamento',
        variant: 'destructive'
      })
    } finally {
      setLoadingId(null)
    }
  }

  // Separar por status
  const overdue = installments.filter(i => i.isOverdue)
  const upcoming = installments.filter(i => !i.isOverdue)

  return (
    <div className="space-y-6">
      {/* Parcelas Vencidas */}
      {overdue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-600">
              Parcelas Vencidas ({overdue.length})
            </h3>
          </div>
          <div className="grid gap-4">
            {overdue.map((installment) => (
              <InstallmentCard
                key={installment.id}
                installment={installment}
                currency={currency}
                isOverdue={true}
                onConfirm={() => handleConfirmPayment(installment.id)}
                isLoading={loadingId === installment.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Próximas Parcelas */}
      {upcoming.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">
              Próximas Parcelas ({upcoming.length})
            </h3>
          </div>
          <div className="grid gap-4">
            {upcoming.map((installment) => (
              <InstallmentCard
                key={installment.id}
                installment={installment}
                currency={currency}
                isOverdue={false}
                onConfirm={() => handleConfirmPayment(installment.id)}
                isLoading={loadingId === installment.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InstallmentCard({
  installment,
  currency,
  isOverdue,
  onConfirm,
  isLoading
}: {
  installment: any
  currency: string
  isOverdue: boolean
  onConfirm: () => void
  isLoading: boolean
}) {
  const dueDate = new Date(installment.due_date)
  const customerName = installment.appointment?.customer?.name || 'Cliente'
  const initials = getAvatarInitials(customerName)

  return (
    <Card className={isOverdue ? 'border-red-300 bg-red-50/50 dark:bg-red-950/10' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          {/* Cliente */}
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={installment.appointment?.customer?.avatar_url} alt={customerName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-base flex items-center gap-2">
                {customerName}
                {isOverdue && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Vencida
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                <div className="flex flex-col gap-1 mt-1">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Serviço: {installment.appointment?.service?.name || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {installment.appointment?.customer?.phone || 'Sem telefone'}
                  </span>
                </div>
              </CardDescription>
            </div>
          </div>

          {/* Valor */}
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(installment.installment_amount, currency as any)}
            </div>
            <Badge variant="outline" className="mt-1">
              Parcela {installment.installment_number}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>
                Vencimento: {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            {isOverdue && (
              <span className="text-red-600 font-medium">
                (Atrasada {formatDistanceToNow(dueDate, { locale: ptBR, addSuffix: false })})
              </span>
            )}
          </div>

          <Button
            onClick={onConfirm}
            disabled={isLoading}
            size="sm"
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirmar Pagamento
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
