'use client'

import { Button } from '@/components/ui/button'
import { CancelAppointmentButton } from './cancel-appointment-button'
import { CalendarClock } from 'lucide-react'
import Link from 'next/link'

interface AppointmentActionsProps {
  appointmentId: string
  businessSlug: string
  canCancel: boolean
  minHours: number
  hoursUntil?: number
  status: string
}

export function AppointmentActions({
  appointmentId,
  businessSlug,
  canCancel,
  minHours,
  hoursUntil,
  status,
}: AppointmentActionsProps) {
  const isCancelled = status === 'cancelled'

  if (isCancelled) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {canCancel && (
          <>
            <CancelAppointmentButton 
              appointmentId={appointmentId}
              minHours={minHours}
              size="sm"
            />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/agendar/${businessSlug}?remarcar=${appointmentId}`}>
                <CalendarClock className="h-4 w-4 mr-2" />
                Remarcar
              </Link>
            </Button>
          </>
        )}
      </div>
      
      {!canCancel && hoursUntil !== undefined && (
        <p className="text-xs text-muted-foreground">
          Cancelamento/remarcação disponível apenas com {minHours}h de antecedência.
          {hoursUntil > 0 && ` Faltam ${Math.ceil(hoursUntil)}h para o agendamento.`}
        </p>
      )}
    </div>
  )
}
