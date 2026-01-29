'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, DollarSign, CreditCard, Banknote, Smartphone, Building2, MoreHorizontal } from 'lucide-react'
import { PAYMENT_METHOD_LABELS } from '@/types/shared'
import type { PaymentMethod } from '@/types/shared'
import { formatCurrency } from '@/lib/utils/country'

interface PaymentConfirmationDialogProps {
  appointment: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (paymentData: PaymentData) => Promise<{ success: boolean; error?: string }>
  currency: string
}

interface PaymentData {
  paymentMethod: PaymentMethod
  paymentType: 'cash' | 'installment'
  installmentCount?: number
  notes?: string
}

const paymentMethodIcons = {
  cash: Banknote,
  credit_card: CreditCard,
  debit_card: CreditCard,
  pix: Smartphone,
  transfer: Building2,
  other: MoreHorizontal
}

export function PaymentConfirmationDialog({
  appointment,
  open,
  onOpenChange,
  onConfirm,
  currency
}: PaymentConfirmationDialogProps) {
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [installmentCount, setInstallmentCount] = useState(2)
  const [isLoading, setIsLoading] = useState(false)

  const totalAmount = appointment?.price || 0
  const installmentValue = totalAmount / installmentCount

  const handleConfirm = async () => {
    if (!paymentMethod) {
      return
    }

    setIsLoading(true)

    try {
      const paymentData: PaymentData = {
        paymentMethod,
        paymentType,
        installmentCount: paymentType === 'installment' ? installmentCount : undefined
      }

      const result = await onConfirm(paymentData)

      if (result.success) {
        onOpenChange(false)
        // Reset form
        setPaymentType('cash')
        setPaymentMethod('cash')
        setInstallmentCount(2)
      }
    } catch (error) {
      console.error('Payment error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!appointment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Confirmar Pagamento
          </DialogTitle>
          <DialogDescription>
            Registre o pagamento do cliente para este serviço
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resumo do Agendamento */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {appointment.service?.name || 'Serviço'}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Cliente: {appointment.customer?.name || 'N/A'}
                  </p>
                </div>
                <Badge className="bg-green-600 hover:bg-green-700">
                  {formatCurrency(totalAmount, currency as any)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-3">
            <Label htmlFor="paymentMethod">Método de Pagamento *</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => {
                  const Icon = paymentMethodIcons[method]
                  return (
                    <SelectItem key={method} value={method}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{PAYMENT_METHOD_LABELS[method]}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Tipo de Pagamento */}
          <div className="space-y-3">
            <Label>Forma de Pagamento *</Label>
            <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as 'cash' | 'installment')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex-1 cursor-pointer font-normal">
                  À Vista
                  <p className="text-sm text-muted-foreground">Pagamento total imediato</p>
                </Label>
                <Badge variant="secondary">{formatCurrency(totalAmount, currency as any)}</Badge>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="installment" id="installment" />
                <Label htmlFor="installment" className="flex-1 cursor-pointer font-normal">
                  Parcelado
                  <p className="text-sm text-muted-foreground">Dividir em parcelas mensais</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Configuração de Parcelas */}
          {paymentType === 'installment' && (
            <div className="space-y-3 animate-in fade-in-50 slide-in-from-top-2">
              <Label htmlFor="installmentCount">Número de Parcelas *</Label>
              <Select
                value={installmentCount.toString()}
                onValueChange={(value) => setInstallmentCount(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((count) => (
                    <SelectItem key={count} value={count.toString()}>
                      {count}x de {formatCurrency(totalAmount / count, currency as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Detalhes das Parcelas */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Resumo do Parcelamento:</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Parcelas:</span>
                    <span className="font-medium text-foreground">{installmentCount}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor por parcela:</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(installmentValue, currency as any)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Primeira parcela vence em:</span>
                    <span className="font-medium text-foreground">30 dias</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !paymentMethod}
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {paymentType === 'cash' ? 'Confirmar Pagamento' : 'Confirmar Parcelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
