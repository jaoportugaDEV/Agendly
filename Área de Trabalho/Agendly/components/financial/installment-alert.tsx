'use client'

import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

interface InstallmentAlertProps {
  hasOverdue: boolean
  nextDueDate?: string
  variant?: 'badge' | 'icon'
}

export function InstallmentAlert({ hasOverdue, nextDueDate, variant = 'badge' }: InstallmentAlertProps) {
  if (!hasOverdue && !nextDueDate) {
    return null
  }

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <AlertCircle className={`h-4 w-4 ${hasOverdue ? 'text-red-600' : 'text-orange-500'}`} />
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasOverdue ? 'Parcela vencida!' : `Próxima parcela: ${nextDueDate}`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (hasOverdue) {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <AlertCircle className="h-3 w-3" />
        Parcela Vencida
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1 text-xs border-orange-200 text-orange-700 bg-orange-50 dark:bg-orange-950/20">
      <AlertCircle className="h-3 w-3" />
      Parcelado
    </Badge>
  )
}
