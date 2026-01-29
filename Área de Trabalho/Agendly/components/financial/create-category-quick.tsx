'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus } from 'lucide-react'
import { createExpenseCategory } from '@/lib/actions/expenses'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface CreateCategoryQuickProps {
  businessId: string
  onCreated?: (categoryId: string, categoryName: string) => void
}

export function CreateCategoryQuick({ businessId, onCreated }: CreateCategoryQuickProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6B7280'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await createExpenseCategory(businessId, formData)

      if (result.success) {
        toast({
          title: 'Categoria criada!',
          description: 'Categoria adicionada com sucesso',
        })
        
        // Callback para o componente pai
        if (onCreated && result.data) {
          onCreated(result.data.id, result.data.name)
        }
        
        setOpen(false)
        router.refresh()
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          color: '#6B7280'
        })
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível criar categoria',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao criar categoria',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
          <DialogDescription>
            Crie uma categoria personalizada para organizar suas despesas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Categoria *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Material de Escritório"
              required
              maxLength={50}
            />
          </div>

          {/* Descrição */}
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva esta categoria..."
              rows={3}
              maxLength={255}
            />
          </div>

          {/* Cor */}
          <div className="grid gap-2">
            <Label htmlFor="color">Cor</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-20 h-10"
              />
              <span className="text-sm text-muted-foreground">{formData.color}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Categoria
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
