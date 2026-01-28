'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface PeakHoursChartProps {
  data: Array<{
    hour: number
    count: number
  }>
}

export function PeakHoursChart({ data }: PeakHoursChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    hourFormatted: `${item.hour}h`
  }))

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Horários de Pico</CardTitle>
        <CardDescription>Distribuição de agendamentos por hora</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hourFormatted" 
              stroke="#888888"
              fontSize={12}
            />
            <YAxis 
              stroke="#888888"
              fontSize={12}
            />
            <Tooltip />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
              name="Agendamentos"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
