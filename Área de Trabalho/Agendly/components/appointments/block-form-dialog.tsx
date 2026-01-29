'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface BlockFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  staff: any[]
  selectedDate?: Date
  selectedTime?: string
  onSuccess: () => void
}

const COLORS = [
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#eab308', label: 'Amarelo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#a855f7', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6b7280', label: 'Cinza' },
]

const WEEKDAYS = [
  { value: '0', label: 'Domingo', short: 'D' },
  { value: '1', label: 'Segunda', short: 'S' },
  { value: '2', label: 'Terça', short: 'T' },
  { value: '3', label: 'Quarta', short: 'Q' },
  { value: '4', label: 'Quinta', short: 'Q' },
  { value: '5', label: 'Sexta', short: 'S' },
  { value: '6', label: 'Sábado', short: 'S' },
]

export function BlockFormDialog({
  open,
  onOpenChange,
  businessId,
  staff,
  selectedDate,
  selectedTime,
  onSuccess,
}: BlockFormDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // Usar user_id ao invés de id (business_member.id)
  const [staffId, setStaffId] = useState(staff[0]?.user_id || staff[0]?.users?.id || '')
  const [appliesToAll, setAppliesToAll] = useState(false)
  const [reason, setReason] = useState('')
  const [startTime, setStartTime] = useState(selectedTime || '09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [color, setColor] = useState('#ef4444')
  const [frequency, setFrequency] = useState<'once' | 'daily' | 'weekly' | 'custom_weekly' | 'monthly'>('once')
  const [weekday, setWeekday] = useState(selectedDate ? String(selectedDate.getDay()) : '1')
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]) // Para múltiplos dias
  const [endsNever, setEndsNever] = useState(true)
  const [endDate, setEndDate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe o motivo do bloqueio',
        variant: 'destructive',
      })
      return
    }

    if (!appliesToAll && !staffId) {
      toast({
        title: 'Erro',
        description: 'Selecione um colaborador ou marque "Todos os funcionários"',
        variant: 'destructive',
      })
      return
    }

    if (frequency === 'custom_weekly' && selectedWeekdays.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um dia da semana',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const payload = {
        businessId,
        staffId: appliesToAll ? null : staffId,
        appliesToAll,
        reason,
        startTime: `${format(selectedDate || new Date(), 'yyyy-MM-dd')}T${startTime}`,
        endTime: `${format(selectedDate || new Date(), 'yyyy-MM-dd')}T${endTime}`,
        color,
        frequency,
        weekday: frequency === 'weekly' ? parseInt(weekday) : null,
        selectedWeekdays: frequency === 'custom_weekly' ? selectedWeekdays.map(Number) : null,
        endDate: endsNever ? null : endDate,
      }
      
      console.log('Enviando payload:', payload)
      console.log('Staff disponíveis:', staff)
      
      const response = await fetch('/api/schedule-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Erro ao criar bloqueio')

      toast({
        title: 'Bloqueio criado',
        description: 'Horário indisponível adicionado com sucesso',
      })

      onSuccess()
      onOpenChange(false)
      
      // Limpar form
      setReason('')
      setFrequency('once')
      setEndsNever(true)
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o bloqueio',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Horário Indisponível</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Aplicar a todos */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="applies-to-all" className="text-sm font-medium cursor-pointer">
                Todos os Funcionários
              </Label>
              <p className="text-xs text-muted-foreground">
                Este bloqueio se aplicará a todos os colaboradores
              </p>
            </div>
            <input
              id="applies-to-all"
              type="checkbox"
              checked={appliesToAll}
              onChange={(e) => {
                setAppliesToAll(e.target.checked)
                if (e.target.checked) {
                  setStaffId('')
                }
              }}
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          {/* Colaborador (apenas se não for para todos) */}
          {!appliesToAll && (
            <div className="space-y-2">
              <Label htmlFor="staff">Colaborador *</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger id="staff">
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.user_id || s.users?.id}>
                      {s.users?.full_name || s.users?.email || 'Colaborador'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo *</Label>
            <Input
              id="reason"
              placeholder="Ex: Folga, Almoço, Reunião..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Começa às</Label>
              <Input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Termina às</Label>
              <Input
                id="end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label>Cor de Identificação</Label>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-10 rounded-lg border-2 transition-all ${
                    color === c.value ? 'border-primary ring-2 ring-primary' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Frequência */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequência</Label>
            <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Sem repetição</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
                <SelectItem value="custom_weekly">Dias específicos da semana</SelectItem>
                <SelectItem value="monthly">Mensalmente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dia da Semana (se semanal simples) */}
          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="weekday">Dia da Semana</Label>
              <Select value={weekday} onValueChange={setWeekday}>
                <SelectTrigger id="weekday">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Seletor de Múltiplos Dias (se custom_weekly) */}
          {frequency === 'custom_weekly' && (
            <div className="space-y-3">
              <Label>Dias da Semana</Label>
              <div className="flex justify-center gap-2">
                {WEEKDAYS.map((day) => {
                  const isSelected = selectedWeekdays.includes(day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedWeekdays(selectedWeekdays.filter(d => d !== day.value))
                        } else {
                          setSelectedWeekdays([...selectedWeekdays, day.value])
                        }
                      }}
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                        transition-all border-2
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-110' 
                          : 'bg-background text-muted-foreground border-border hover:border-primary hover:scale-105'
                        }
                      `}
                      title={day.label}
                    >
                      {day.short}
                    </button>
                  )
                })}
              </div>
              {selectedWeekdays.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Selecione pelo menos um dia da semana
                </p>
              )}
              {selectedWeekdays.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {selectedWeekdays.length} dia(s) selecionado(s)
                </p>
              )}
            </div>
          )}

          {/* Quando termina */}
          {frequency !== 'once' && (
            <div className="space-y-3">
              <Label>Termina</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={endsNever}
                    onChange={() => setEndsNever(true)}
                    className="w-4 h-4"
                  />
                  <span>Nunca</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!endsNever}
                    onChange={() => setEndsNever(false)}
                    className="w-4 h-4"
                  />
                  <span>Em uma data específica</span>
                </label>
                {!endsNever && (
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Bloqueio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
