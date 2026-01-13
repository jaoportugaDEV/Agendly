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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { inviteStaffMember } from '@/lib/actions/staff'
import { useToast } from '@/components/ui/use-toast'

interface StaffFormDialogProps {
  businessId: string
  trigger?: React.ReactNode
}

export function StaffFormDialog({ businessId, trigger }: StaffFormDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'staff' as 'admin' | 'staff',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await inviteStaffMember(businessId, formData)

      if (result.success) {
        toast({
          title: 'Funcionário adicionado',
          description: 'O funcionário foi adicionado à equipe com sucesso.',
        })
        setOpen(false)
        setFormData({ email: '', fullName: '', role: 'staff' })
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
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Funcionário</DialogTitle>
            <DialogDescription>
              Adicione um novo membro à sua equipe. O usuário deve estar cadastrado no sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                placeholder="Ex: João Silva"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Função *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'staff') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Funcionário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Administradores têm acesso total. Funcionários veem apenas seus próprios dados.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
