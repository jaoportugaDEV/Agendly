'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

type PeriodType = 'today' | 'week' | 'month' | 'year' | 'custom'

interface DateRangeSelectorProps {
  currentStartDate: string
  currentEndDate: string
  onDateChange?: (startDate: string, endDate: string) => void
}

export function DateRangeSelector({ currentStartDate, currentEndDate, onDateChange }: DateRangeSelectorProps) {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month')
  const [customStart, setCustomStart] = useState<Date | undefined>()
  const [customEnd, setCustomEnd] = useState<Date | undefined>()

  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period)
    
    let start: Date
    let end: Date
    const now = new Date()

    switch (period) {
      case 'today':
        start = startOfDay(now)
        end = endOfDay(now)
        break
      case 'week':
        start = startOfWeek(now, { locale: ptBR })
        end = endOfWeek(now, { locale: ptBR })
        break
      case 'month':
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case 'year':
        start = startOfYear(now)
        end = endOfYear(now)
        break
      case 'custom':
        // Não atualizar ainda, esperar usuário selecionar datas
        return
    }

    const startStr = start.toISOString()
    const endStr = end.toISOString()

    if (onDateChange) {
      onDateChange(startStr, endStr)
    } else {
      // Refresh com query params
      router.refresh()
    }
  }

  const handleCustomDateApply = () => {
    if (!customStart || !customEnd) return

    const startStr = startOfDay(customStart).toISOString()
    const endStr = endOfDay(customEnd).toISOString()

    if (onDateChange) {
      onDateChange(startStr, endStr)
    } else {
      router.refresh()
    }
  }

  const getDateRangeLabel = () => {
    if (selectedPeriod === 'custom' && customStart && customEnd) {
      return `${format(customStart, 'dd/MM/yyyy')} - ${format(customEnd, 'dd/MM/yyyy')}`
    }
    
    const start = new Date(currentStartDate)
    const end = new Date(currentEndDate)
    
    return `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Botões Rápidos */}
      <div className="flex gap-1 border rounded-lg p-1">
        <Button
          variant={selectedPeriod === 'today' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handlePeriodChange('today')}
          className="h-8"
        >
          Hoje
        </Button>
        <Button
          variant={selectedPeriod === 'week' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handlePeriodChange('week')}
          className="h-8"
        >
          Semana
        </Button>
        <Button
          variant={selectedPeriod === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handlePeriodChange('month')}
          className="h-8"
        >
          Mês
        </Button>
        <Button
          variant={selectedPeriod === 'year' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handlePeriodChange('year')}
          className="h-8"
        >
          Ano
        </Button>
      </div>

      {/* Período Customizado */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
            size="sm"
            className="h-9 gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            {selectedPeriod === 'custom' ? getDateRangeLabel() : 'Customizado'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3 space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Data Inicial</p>
              <Calendar
                mode="single"
                selected={customStart}
                onSelect={(date) => {
                  setCustomStart(date)
                  setSelectedPeriod('custom')
                }}
                locale={ptBR}
                className="rounded-md border"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Data Final</p>
              <Calendar
                mode="single"
                selected={customEnd}
                onSelect={(date) => {
                  setCustomEnd(date)
                  setSelectedPeriod('custom')
                }}
                locale={ptBR}
                disabled={(date) => customStart ? date < customStart : false}
                className="rounded-md border"
              />
            </div>

            <Button
              onClick={handleCustomDateApply}
              disabled={!customStart || !customEnd}
              className="w-full"
            >
              Aplicar Período
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Label do período atual */}
      <span className="text-sm text-muted-foreground">
        {getDateRangeLabel()}
      </span>
    </div>
  )
}
