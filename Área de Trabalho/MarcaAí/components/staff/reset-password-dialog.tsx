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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetStaffPassword } from '@/lib/actions/staff'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Key } from 'lucide-react'

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  userId: string
  userName: string
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  businessId,
  userId,
  userName,
}: ResetPasswordDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await resetStaffPassword(businessId, userId, formData)

    if (result.success) {
      toast({
        title: 'Senha redefinida',
        description: `A senha de ${userName} foi alterada com sucesso.`,
      })
      onOpenChange(false)
      setFormData({ password: '', confirmPassword: '' })
      router.refresh()
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Redefinir Senha
          </DialogTitle>
          <DialogDescription>
            Defina uma nova senha para <strong>{userName}</strong>.
            O funcionário poderá fazer login com a nova senha imediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Mínimo 6 caracteres"
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              A senha deve conter letras maiúsculas, minúsculas e números
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="Digite a senha novamente"
              required
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
