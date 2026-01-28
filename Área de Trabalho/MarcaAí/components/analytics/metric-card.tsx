'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  formatAs?: 'currency' | 'percentage' | 'number'
  currency?: string
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  formatAs = 'number',
  currency = 'EUR'
}: MetricCardProps) {
  const formatValue = () => {
    if (formatAs === 'currency') {
      return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency,
      }).format(Number(value))
    }
    if (formatAs === 'percentage') {
      return `${Number(value).toFixed(1)}%`
    }
    return value
  }

  const getChangeIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-4 w-4" />
    if (change > 0) return <ArrowUp className="h-4 w-4" />
    return <ArrowDown className="h-4 w-4" />
  }

  const getChangeColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground'
    if (change > 0) return 'text-green-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue()}</div>
        {change !== undefined && (
          <p className={`text-xs flex items-center gap-1 mt-1 ${getChangeColor()}`}>
            {getChangeIcon()}
            <span>
              {Math.abs(change).toFixed(1)}% {changeLabel || 'vs período anterior'}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
