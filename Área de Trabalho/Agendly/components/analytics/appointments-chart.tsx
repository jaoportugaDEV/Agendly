'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AppointmentsChartProps {
  data: Array<{
    date: string
    count: number
    revenue: number
  }>
}

export function AppointmentsChart({ data }: AppointmentsChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    dateFormatted: format(new Date(item.date), 'dd MMM', { locale: ptBR })
  }))

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Evolução de Agendamentos</CardTitle>
        <CardDescription>Número de agendamentos e receita por dia</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="dateFormatted" 
              stroke="#888888"
              fontSize={12}
            />
            <YAxis 
              stroke="#888888"
              fontSize={12}
              yAxisId="left"
            />
            <YAxis 
              stroke="#888888"
              fontSize={12}
              yAxisId="right"
              orientation="right"
            />
            <Tooltip />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Agendamentos"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              name="Receita (€)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
