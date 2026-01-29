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
  DialogTrigger,
} from '@/components/ui/dialog'
import { deletePromotion } from '@/lib/actions/promotions'
import { Loader2, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DeletePromotionDialogProps {
  promotionId: string
  promotionName: string
  trigger?: React.ReactNode
}

export function DeletePromotionDialog({
  promotionId,
  promotionName,
  trigger,
}: DeletePromotionDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    const result = await deletePromotion(promotionId)

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: 'Promoção excluída com sucesso',
      })
      setOpen(false)
      router.refresh()
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Erro ao excluir promoção',
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Promoção</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a promoção <strong>{promotionName}</strong>?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
