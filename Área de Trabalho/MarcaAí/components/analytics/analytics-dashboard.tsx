'use client'

import { useState, useEffect } from 'react'
import { DateRangePicker } from './date-range-picker'
import { MetricCard } from './metric-card'
import { AppointmentsChart } from './appointments-chart'
import { ServicesRanking } from './services-ranking'
import { StaffRanking } from './staff-ranking'
import { PeakHoursChart } from './peak-hours-chart'
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  XCircle,
  Users,
  UserCheck
} from 'lucide-react'
import { subDays } from 'date-fns'
import {
  getBusinessAnalytics,
  getServicePerformance,
  getStaffPerformance,
  getAppointmentsByDay,
  getPeakHours,
  type BusinessMetrics,
  type ServicePerformance,
  type StaffPerformance,
  type AppointmentsByDay,
  type PeakHours
} from '@/lib/actions/analytics'

interface AnalyticsDashboardProps {
  businessId: string
  currency?: string
}

export function AnalyticsDashboard({ businessId, currency = 'EUR' }: AnalyticsDashboardProps) {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 29))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null)
  const [services, setServices] = useState<ServicePerformance[]>([])
  const [staff, setStaff] = useState<StaffPerformance[]>([])
  const [appointmentsByDay, setAppointmentsByDay] = useState<AppointmentsByDay[]>([])
  const [peakHours, setPeakHours] = useState<PeakHours[]>([])

  useEffect(() => {
    loadData()
  }, [startDate, endDate, businessId])

  const loadData = async () => {
    setLoading(true)
    
    const [
      metricsResult,
      servicesResult,
      staffResult,
      byDayResult,
      peakResult
    ] = await Promise.all([
      getBusinessAnalytics(businessId, startDate.toISOString(), endDate.toISOString()),
      getServicePerformance(businessId, startDate.toISOString(), endDate.toISOString()),
      getStaffPerformance(businessId, startDate.toISOString(), endDate.toISOString()),
      getAppointmentsByDay(businessId, startDate.toISOString(), endDate.toISOString()),
      getPeakHours(businessId, startDate.toISOString(), endDate.toISOString())
    ])

    if (metricsResult.success && metricsResult.data) {
      setMetrics(metricsResult.data)
    }
    if (servicesResult.success && servicesResult.data) {
      setServices(servicesResult.data)
    }
    if (staffResult.success && staffResult.data) {
      setStaff(staffResult.data)
    }
    if (byDayResult.success && byDayResult.data) {
      setAppointmentsByDay(byDayResult.data)
    }
    if (peakResult.success && peakResult.data) {
      setPeakHours(peakResult.data)
    }

    setLoading(false)
  }

  const handleRangeChange = (start: Date, end: Date) => {
    setStartDate(start)
    setEndDate(end)
  }

  if (loading && !metrics) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-full max-w-2xl" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <DateRangePicker 
        startDate={startDate}
        endDate={endDate}
        onRangeChange={handleRangeChange}
      />

      {/* Metric Cards */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total de Agendamentos"
            value={metrics.totalAppointments}
            change={metrics.totalAppointmentsChange}
            icon={Calendar}
          />
          <MetricCard
            title="Taxa de Ocupação"
            value={metrics.occupancyRate}
            change={metrics.occupancyRateChange}
            icon={TrendingUp}
            formatAs="percentage"
          />
          <MetricCard
            title="Receita Estimada"
            value={metrics.estimatedRevenue}
            change={metrics.estimatedRevenueChange}
            icon={DollarSign}
            formatAs="currency"
            currency={currency}
          />
          <MetricCard
            title="Taxa de Cancelamento"
            value={metrics.cancellationRate}
            change={-metrics.cancellationRateChange}
            icon={XCircle}
            formatAs="percentage"
          />
        </div>
      )}

      {/* Customer Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard
            title="Novos Clientes"
            value={metrics.newCustomers}
            icon={Users}
          />
          <MetricCard
            title="Clientes Recorrentes"
            value={metrics.returningCustomers}
            icon={UserCheck}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1">
        {appointmentsByDay.length > 0 && (
          <AppointmentsChart data={appointmentsByDay} />
        )}
      </div>

      {/* Rankings */}
      <div className="grid gap-4 md:grid-cols-2">
        <ServicesRanking data={services} currency={currency} />
        <StaffRanking data={staff} currency={currency} />
      </div>

      {/* Peak Hours */}
      <div className="grid gap-4 grid-cols-1">
        {peakHours.length > 0 && (
          <PeakHoursChart data={peakHours} />
        )}
      </div>
    </div>
  )
}
