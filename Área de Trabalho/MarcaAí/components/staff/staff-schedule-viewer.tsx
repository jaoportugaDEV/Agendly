'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Loader2 } from 'lucide-react'
import { getStaffSchedules } from '@/lib/actions/schedules'

interface StaffScheduleViewerProps {
  businessId: string
  staffId: string
  staffName: string
}

const DAYS_MAP: Record<string, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export function StaffScheduleViewer({ businessId, staffId, staffName }: StaffScheduleViewerProps) {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSchedules()
  }, [businessId, staffId])

  const loadSchedules = async () => {
    setLoading(true)
    const result = await getStaffSchedules(businessId, staffId)
    if (result.success && result.data) {
      setSchedules(result.data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (schedules.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Nenhum horário configurado
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {schedules.map((schedule) => (
        <div
          key={schedule.id}
          className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
        >
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">
              {DAYS_MAP[schedule.day_of_week]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {schedule.start_time.substring(0, 5)}
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="font-mono">
              {schedule.end_time.substring(0, 5)}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
