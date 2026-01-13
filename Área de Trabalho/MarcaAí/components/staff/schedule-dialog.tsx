'use client'

import { useState, useEffect } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { bulkCreateStaffSchedules, getStaffSchedules } from '@/lib/actions/schedules'
import { useToast } from '@/components/ui/use-toast'
import { DAY_LABELS, DAYS_OF_WEEK, type DayOfWeek } from '@/types/shared'
import { Clock } from 'lucide-react'

interface ScheduleDialogProps {
  businessId: string
  staffId: string
  staffName: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type DaySchedule = {
  enabled: boolean
  startTime: string
  endTime: string
}

type WeekSchedule = Record<DayOfWeek, DaySchedule>

export function ScheduleDialog({
  businessId,
  staffId,
  staffName,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ScheduleDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  const [loadingData, setLoadingData] = useState(false)
  const [schedule, setSchedule] = useState<WeekSchedule>({
    monday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    tuesday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    wednesday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    thursday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    friday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    saturday: { enabled: false, startTime: '09:00', endTime: '14:00' },
    sunday: { enabled: false, startTime: '09:00', endTime: '14:00' },
  })

  useEffect(() => {
    if (open) {
      loadSchedules()
    }
  }, [open])

  const loadSchedules = async () => {
    setLoadingData(true)
    const result = await getStaffSchedules(businessId, staffId)

    if (result.success && result.data) {
      const newSchedule = { ...schedule }
      result.data.forEach((item: any) => {
        newSchedule[item.day_of_week as DayOfWeek] = {
          enabled: true,
          startTime: item.start_time,
          endTime: item.end_time,
        }
      })
      setSchedule(newSchedule)
    }
    setLoadingData(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Filtrar apenas os dias ativados
      const enabledSchedules = DAYS_OF_WEEK.filter(
        (day) => schedule[day].enabled
      ).map((day) => ({
        dayOfWeek: day,
        startTime: schedule[day].startTime,
        endTime: schedule[day].endTime,
      }))

      if (enabledSchedules.length === 0) {
        toast({
          title: 'Erro',
          description: 'Selecione pelo menos um dia de trabalho',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const result = await bulkCreateStaffSchedules(
        businessId,
        staffId,
        enabledSchedules
      )

      if (result.success) {
        toast({
          title: 'Horários salvos',
          description: 'Os horários de trabalho foram atualizados com sucesso.',
        })
        setOpen(false)
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

  const toggleDay = (day: DayOfWeek, enabled: boolean) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], enabled },
    })
  }

  const updateTime = (day: DayOfWeek, field: 'startTime' | 'endTime', value: string) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], [field]: value },
    })
  }

  const applyToAll = () => {
    const firstEnabled = DAYS_OF_WEEK.find((day) => schedule[day].enabled)
    if (!firstEnabled) return

    const template = schedule[firstEnabled]
    const newSchedule = { ...schedule }

    DAYS_OF_WEEK.forEach((day) => {
      if (newSchedule[day].enabled) {
        newSchedule[day] = { ...template, enabled: true }
      }
    })

    setSchedule(newSchedule)
    toast({
      title: 'Horários aplicados',
      description: 'Os horários foram aplicados a todos os dias ativos.',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Horários de Trabalho</DialogTitle>
            <DialogDescription>
              Defina os horários de trabalho de {staffName}
            </DialogDescription>
          </DialogHeader>

          {loadingData ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando horários...
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyToAll}
                  disabled={!DAYS_OF_WEEK.some((day) => schedule[day].enabled)}
                >
                  Aplicar a todos
                </Button>
              </div>

              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <Switch
                      checked={schedule[day].enabled}
                      onCheckedChange={(enabled) => toggleDay(day, enabled)}
                    />
                    <Label className="cursor-pointer">
                      {DAY_LABELS[day]}
                    </Label>
                  </div>

                  {schedule[day].enabled && (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={schedule[day].startTime}
                          onChange={(e) =>
                            updateTime(day, 'startTime', e.target.value)
                          }
                          className="w-[120px]"
                          required
                        />
                      </div>
                      <span className="text-muted-foreground">até</span>
                      <Input
                        type="time"
                        value={schedule[day].endTime}
                        onChange={(e) =>
                          updateTime(day, 'endTime', e.target.value)
                        }
                        className="w-[120px]"
                        required
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || loadingData}>
              {loading ? 'Salvando...' : 'Salvar Horários'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
