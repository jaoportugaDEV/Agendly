'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteService } from '@/lib/actions/services'
import { useToast } from '@/components/ui/use-toast'
import { AlertTriangle } from 'lucide-react'

interface DeleteServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: {
    id: string
    name: string
  }
}

export function DeleteServiceDialog({
  open,
  onOpenChange,
  service,
}: DeleteServiceDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const result = await deleteService(service.id)

      if (result.success) {
        toast({
          title: 'Serviço excluído',
          description: `O serviço "${service.name}" foi excluído com sucesso.`,
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Excluir Serviço</DialogTitle>
          </div>
          <DialogDescription>
            Tem certeza que deseja excluir o serviço <strong>{service.name}</strong>?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
