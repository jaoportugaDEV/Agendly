'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'
import { deleteBusiness } from '@/lib/actions/business'
import { useToast } from '@/hooks/use-toast'

interface DeleteBusinessSectionProps {
  businessId: string
  businessName: string
}

export function DeleteBusinessSection({ businessId, businessName }: DeleteBusinessSectionProps) {
  const { toast } = useToast()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== businessName) {
      toast({
        title: 'Erro',
        description: 'O nome da empresa não corresponde',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const result = await deleteBusiness(businessId)

      if (result && !result.success) {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao excluir empresa',
          variant: 'destructive',
        })
        setLoading(false)
      }
      // Se success, a action vai redirecionar automaticamente
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao excluir empresa',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 border-destructive">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-destructive">Zona de Perigo</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ações irreversíveis que afetam permanentemente sua empresa
          </p>
        </div>

        <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
          <div>
            <h4 className="font-medium">Excluir Empresa</h4>
            <p className="text-sm text-muted-foreground">
              Exclui permanentemente esta empresa e todos os dados associados
            </p>
          </div>

          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    Esta ação <strong className="text-destructive">não pode ser desfeita</strong>.
                    Isso irá excluir permanentemente a empresa <strong>{businessName}</strong> e
                    remover todos os dados associados:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Todos os agendamentos</li>
                    <li>Todos os clientes</li>
                    <li>Todos os serviços</li>
                    <li>Toda a equipe</li>
                    <li>Todas as configurações</li>
                  </ul>
                  <p className="pt-2">
                    Digite <strong>{businessName}</strong> para confirmar:
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="py-2">
                <Label htmlFor="confirm-name" className="sr-only">
                  Nome da empresa
                </Label>
                <Input
                  id="confirm-name"
                  placeholder={businessName}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={loading}
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  disabled={confirmText !== businessName || loading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {loading ? 'Excluindo...' : 'Excluir Permanentemente'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  )
}
