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
import { removeStaffMember } from '@/lib/actions/staff'
import { useToast } from '@/components/ui/use-toast'
import { AlertTriangle } from 'lucide-react'

interface RemoveStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  member: {
    id: string
    users: {
      full_name: string | null
      email: string
    } | null
  }
}

export function RemoveStaffDialog({
  open,
  onOpenChange,
  businessId,
  member,
}: RemoveStaffDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleRemove = async () => {
    setLoading(true)

    try {
      const result = await removeStaffMember(businessId, member.id)

      if (result.success) {
        toast({
          title: 'Funcionário removido',
          description: `${
            member.users?.full_name || member.users?.email || 'Funcionário'
          } foi removido da equipe.`,
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
            <DialogTitle>Remover Funcionário</DialogTitle>
          </div>
          <DialogDescription>
            Tem certeza que deseja remover{' '}
            <strong>{member.users?.full_name || member.users?.email || 'este funcionário'}</strong> da equipe?
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
            onClick={handleRemove}
            disabled={loading}
          >
            {loading ? 'Removendo...' : 'Remover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
