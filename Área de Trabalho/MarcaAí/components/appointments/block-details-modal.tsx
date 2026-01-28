'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, User, Trash2, Edit, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface BlockDetailsModalProps {
  block: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function BlockDetailsModal({
  block,
  open,
  onOpenChange,
  onUpdate,
}: BlockDetailsModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const getFrequencyLabel = (pattern: string | null) => {
    if (!pattern) return 'Sem repetição'
    const labels: Record<string, string> = {
      daily: 'Diariamente',
      weekly: 'Semanalmente',
      custom_weekly: 'Dias específicos da semana',
      monthly: 'Mensalmente',
    }
    return labels[pattern] || 'Sem repetição'
  }

  const handleDelete = async () => {
    if (!block || !confirm('Tem certeza que deseja excluir este bloqueio?')) return
    setLoading(true)

    try {
      const response = await fetch(`/api/schedule-blocks/${block.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir')

      toast({
        title: 'Bloqueio excluído',
        description: 'O horário indisponível foi removido com sucesso',
      })

      onOpenChange(false)
      await onUpdate()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o bloqueio',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSeries = async () => {
    if (!block || !block.is_recurring) return
    if (!confirm('Deseja excluir TODAS as ocorrências deste bloqueio?')) return
    
    setLoading(true)

    try {
      const response = await fetch(`/api/schedule-blocks/${block.id}/series`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir série')

      toast({
        title: 'Série excluída',
        description: 'Todos os bloqueios recorrentes foram removidos',
      })

      onOpenChange(false)
      await onUpdate()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a série',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!block) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Horário Indisponível</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visualização do Bloqueio */}
          <div
            className="p-4 rounded-lg text-white relative overflow-hidden"
            style={{ backgroundColor: '#374151' }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: block.color }}
            />
            <p className="font-bold text-lg">{block.reason}</p>
            <p className="text-sm opacity-80 mt-1">
              {format(new Date(block.start_time), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>

          {/* Horário */}
          <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Horário</p>
              <p className="font-semibold">
                {format(new Date(block.start_time), 'HH:mm')} - {format(new Date(block.end_time), 'HH:mm')}
              </p>
            </div>
          </div>

          {/* Frequência */}
          <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Frequência</p>
              <p className="font-semibold">{getFrequencyLabel(block.recurrence_pattern)}</p>
              {block.is_recurring && (
                <Badge variant="secondary" className="mt-2">
                  Bloqueio Recorrente
                </Badge>
              )}
            </div>
          </div>

          {/* Cor de Identificação */}
          <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
            <div
              className="h-10 w-10 rounded-lg border-2 border-white shadow-sm"
              style={{ backgroundColor: block.color }}
            />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Cor de Identificação</p>
              <p className="font-medium">{block.color}</p>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-2 pt-4 border-t">
            {block.is_recurring && (
              <Button
                variant="destructive"
                onClick={handleDeleteSeries}
                disabled={loading}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Série Completa
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={loading}
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {block.is_recurring ? 'Excluir Apenas Este' : 'Excluir Bloqueio'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
