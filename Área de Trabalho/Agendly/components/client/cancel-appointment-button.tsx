'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cancelClientAppointment } from '@/lib/actions/client-appointments'
import { Loader2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CancelAppointmentButtonProps {
  appointmentId: string
  minHours: number
  size?: 'sm' | 'default'
}

export function CancelAppointmentButton({ 
  appointmentId, 
  minHours,
  size = 'default' 
}: CancelAppointmentButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    
    const result = await cancelClientAppointment(appointmentId)
    
    if (result.success) {
      toast({
        title: 'Agendamento Cancelado',
        description: result.message || 'Seu agendamento foi cancelado com sucesso.',
      })
      setOpen(false)
      router.refresh()
    } else {
      toast({
        title: 'Erro ao Cancelar',
        description: result.error || 'Não foi possível cancelar o agendamento.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={size}>
          <X className="h-4 w-4 mr-2" />
          {size === 'sm' ? 'Cancelar' : 'Cancelar Agendamento'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            {minHours > 0 && (
              <span className="block mt-2 text-sm">
                Lembrando: cancelamentos devem ser feitos com pelo menos {minHours}h de antecedência.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleCancel()
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Cancelamento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
