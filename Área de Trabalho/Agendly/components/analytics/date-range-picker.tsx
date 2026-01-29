'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DateRangePickerProps {
  startDate: Date
  endDate: Date
  onRangeChange: (start: Date, end: Date) => void
}

export function DateRangePicker({ startDate, endDate, onRangeChange }: DateRangePickerProps) {
  const presets = [
    {
      label: 'Hoje',
      action: () => {
        const today = new Date()
        onRangeChange(today, today)
      }
    },
    {
      label: 'Últimos 7 dias',
      action: () => {
        const end = new Date()
        const start = subDays(end, 6)
        onRangeChange(start, end)
      }
    },
    {
      label: 'Últimos 30 dias',
      action: () => {
        const end = new Date()
        const start = subDays(end, 29)
        onRangeChange(start, end)
      }
    },
    {
      label: 'Este mês',
      action: () => {
        const now = new Date()
        onRangeChange(startOfMonth(now), endOfMonth(now))
      }
    },
    {
      label: 'Este ano',
      action: () => {
        const now = new Date()
        onRangeChange(startOfYear(now), endOfYear(now))
      }
    }
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>
          {format(startDate, 'dd MMM yyyy', { locale: ptBR })} - {format(endDate, 'dd MMM yyyy', { locale: ptBR })}
        </span>
      </div>
      <div className="flex gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={preset.action}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
