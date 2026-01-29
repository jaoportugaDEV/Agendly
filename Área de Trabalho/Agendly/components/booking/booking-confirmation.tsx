'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

interface BookingConfirmationProps {
  businessName: string
  onNewBooking?: () => void
}

export function BookingConfirmation({
  businessName,
  onNewBooking,
}: BookingConfirmationProps) {
  return (
    <Card className="p-8 text-center">
      <div className="flex justify-center mb-6">
        <div className="rounded-full bg-green-100 p-4">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-2">Agendamento Confirmado!</h2>
      
      <p className="text-muted-foreground mb-6">
        Seu agendamento em <span className="font-semibold">{businessName}</span> foi
        realizado com sucesso.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          Você receberá uma confirmação nos contatos fornecidos. Por favor, chegue
          com alguns minutos de antecedência.
        </p>
      </div>

      {onNewBooking && (
        <Button onClick={onNewBooking} size="lg">
          Fazer Novo Agendamento
        </Button>
      )}
    </Card>
  )
}
