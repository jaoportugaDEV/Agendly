'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus, AlertCircle } from 'lucide-react'
import { createExpense } from '@/lib/actions/expenses'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { EXPENSE_TYPE_LABELS } from '@/types/shared'
import type { ExpenseType, ExpenseFrequency } from '@/types/shared'
import { CreateCategoryQuick } from './create-category-quick'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ExpenseFormDialogProps {
  businessId: string
  categories: any[]
  trigger?: React.ReactNode
}

export function ExpenseFormDialog({ businessId, categories, trigger }: ExpenseFormDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    expenseType: 'utilities' as ExpenseType,
    categoryId: '',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    frequency: 'once' as ExpenseFrequency,
    isRecurring: false,
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await createExpense(businessId, {
        expenseType: formData.expenseType,
        categoryId: formData.expenseType === 'custom' && formData.categoryId ? formData.categoryId : undefined,
        amount: parseFloat(formData.amount),
        description: formData.description,
        expenseDate: formData.expenseDate,
        dueDate: formData.dueDate || undefined,
        frequency: formData.frequency,
        isRecurring: formData.isRecurring,
        notes: formData.notes || undefined
      })

      if (result.success) {
        toast({
          title: 'Despesa criada!',
          description: result.message || 'Despesa registrada com sucesso',
        })
        setOpen(false)
        router.refresh()
        // Reset form
        setFormData({
          expenseType: 'utilities',
          categoryId: '',
          amount: '',
          description: '',
          expenseDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          frequency: 'once',
          isRecurring: false,
          notes: ''
        })
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível criar despesa',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao criar despesa',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
          <DialogDescription>
            Registre uma despesa da empresa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Despesa */}
          <div className="grid gap-2">
            <Label htmlFor="expenseType">Tipo de Despesa *</Label>
            <Select
              value={formData.expenseType}
              onValueChange={(value) => setFormData({ ...formData, expenseType: value as ExpenseType, categoryId: '' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(EXPENSE_TYPE_LABELS) as ExpenseType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {EXPENSE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoria Customizada (se type = custom) */}
          {formData.expenseType === 'custom' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="categoryId">Categoria *</Label>
                <CreateCategoryQuick 
                  businessId={businessId}
                  onCreated={(id, name) => {
                    setFormData({ ...formData, categoryId: id })
                  }}
                />
              </div>
              
              {categories.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Você ainda não possui categorias customizadas. Clique em "Nova Categoria" acima para criar uma.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  required={formData.expenseType === 'custom'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Descrição */}
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Conta de luz - Janeiro 2024"
              required
            />
          </div>

          {/* Valor */}
          <div className="grid gap-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max="999999.99"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expenseDate">Data da Despesa *</Label>
              <Input
                id="expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dueDate">Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Recorrência */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isRecurring">Despesa Recorrente</Label>
              <p className="text-sm text-muted-foreground">
                Criar automaticamente nos próximos meses
              </p>
            </div>
            <Switch
              id="isRecurring"
              checked={formData.isRecurring}
              onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
            />
          </div>

          {/* Frequência (se recorrente) */}
          {formData.isRecurring && (
            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequência</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value as ExpenseFrequency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Observações */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais (opcional)"
              rows={3}
            />
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
              Criar Despesa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
