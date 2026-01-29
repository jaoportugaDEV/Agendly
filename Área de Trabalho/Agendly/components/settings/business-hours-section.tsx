"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Clock, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { HelpTooltip } from '@/components/help-tooltip'
import {
  getBusinessHours,
  updateDefaultHours,
  toggleCustomHours,
  bulkUpdateDayHours,
} from '@/lib/actions/business-hours'

interface BusinessHoursSectionProps {
  businessId: string
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
]

export function BusinessHoursSection({ businessId }: BusinessHoursSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  
  // Estado para horários padrão
  const [defaultOpening, setDefaultOpening] = useState('09:00')
  const [defaultClosing, setDefaultClosing] = useState('18:00')
  
  // Estado para horários personalizados
  const [customEnabled, setCustomEnabled] = useState(false)
  const [customHours, setCustomHours] = useState<
    Array<{
      dayOfWeek: string
      openingTime: string
      closingTime: string
      isClosed: boolean
    }>
  >(
    DAYS_OF_WEEK.map((day) => ({
      dayOfWeek: day.value,
      openingTime: '09:00',
      closingTime: '18:00',
      isClosed: false,
    }))
  )

  // Carregar horários ao montar o componente
  useEffect(() => {
    loadBusinessHours()
  }, [businessId])

  const loadBusinessHours = async () => {
    setLoadingData(true)
    const result = await getBusinessHours(businessId)
    
    if (result.success && result.data) {
      setDefaultOpening(result.data.defaultOpening)
      setDefaultClosing(result.data.defaultClosing)
      setCustomEnabled(result.data.customHoursEnabled)
      
      if (result.data.customHours && result.data.customHours.length > 0) {
        setCustomHours(result.data.customHours)
      } else {
        // Se não há horários personalizados, usar os padrão para todos os dias
        setCustomHours(
          DAYS_OF_WEEK.map((day) => ({
            dayOfWeek: day.value,
            openingTime: result.data.defaultOpening,
            closingTime: result.data.defaultClosing,
            isClosed: false,
          }))
        )
      }
    }
    
    setLoadingData(false)
  }

  const handleSaveDefaultHours = async () => {
    setLoading(true)

    try {
      const result = await updateDefaultHours(businessId, {
        openingTime: defaultOpening,
        closingTime: defaultClosing,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: 'Sucesso',
        description: 'Horários padrão atualizados com sucesso!',
      })

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar horários',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCustomHours = async (enabled: boolean) => {
    setLoading(true)

    try {
      const result = await toggleCustomHours(businessId, { enabled })

      if (!result.success) {
        throw new Error(result.error)
      }

      setCustomEnabled(enabled)

      toast({
        title: 'Sucesso',
        description: enabled
          ? 'Horários personalizados ativados'
          : 'Horários personalizados desativados',
      })

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar configuração',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCustomHours = async () => {
    setLoading(true)

    try {
      const result = await bulkUpdateDayHours(businessId, customHours)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: 'Sucesso',
        description: 'Horários personalizados salvos com sucesso!',
      })

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar horários',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateDayHours = (
    dayOfWeek: string,
    field: 'openingTime' | 'closingTime' | 'isClosed',
    value: string | boolean
  ) => {
    setCustomHours((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
      )
    )
  }

  if (loadingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horário de Funcionamento
          <HelpTooltip content="Configure o horário de funcionamento do seu estabelecimento. Isso afetará a disponibilidade no calendário e no site público." />
        </CardTitle>
        <CardDescription>
          Defina quando seu estabelecimento está aberto para atendimentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Horários Padrão */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3">Horário Padrão</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-opening">Abertura</Label>
                <Input
                  id="default-opening"
                  type="time"
                  value={defaultOpening}
                  onChange={(e) => setDefaultOpening(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-closing">Fechamento</Label>
                <Input
                  id="default-closing"
                  type="time"
                  value={defaultClosing}
                  onChange={(e) => setDefaultClosing(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveDefaultHours} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Horário Padrão
          </Button>
        </div>

        {/* Toggle Horários Personalizados */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="custom-hours-toggle">Horários Personalizados por Dia</Label>
              <p className="text-sm text-muted-foreground">
                Configure horários diferentes para cada dia da semana
              </p>
            </div>
            <Switch
              id="custom-hours-toggle"
              checked={customEnabled}
              onCheckedChange={handleToggleCustomHours}
              disabled={loading}
            />
          </div>
        </div>

        {/* Horários por Dia da Semana */}
        {customEnabled && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold">Horários por Dia</h3>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const dayHours = customHours.find((h) => h.dayOfWeek === day.value)
                if (!dayHours) return null

                return (
                  <div
                    key={day.value}
                    className="grid grid-cols-[1fr_auto_auto_auto] md:grid-cols-[200px_1fr_1fr_auto] gap-3 items-center border rounded-lg p-3"
                  >
                    <Label className="font-medium">{day.label}</Label>
                    
                    <div className="space-y-1">
                      <Label htmlFor={`${day.value}-open`} className="text-xs text-muted-foreground">
                        Abertura
                      </Label>
                      <Input
                        id={`${day.value}-open`}
                        type="time"
                        value={dayHours.openingTime}
                        onChange={(e) =>
                          updateDayHours(day.value, 'openingTime', e.target.value)
                        }
                        disabled={loading || dayHours.isClosed}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`${day.value}-close`} className="text-xs text-muted-foreground">
                        Fechamento
                      </Label>
                      <Input
                        id={`${day.value}-close`}
                        type="time"
                        value={dayHours.closingTime}
                        onChange={(e) =>
                          updateDayHours(day.value, 'closingTime', e.target.value)
                        }
                        disabled={loading || dayHours.isClosed}
                        className="h-9"
                      />
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <Label htmlFor={`${day.value}-closed`} className="text-xs text-muted-foreground">
                        Fechado
                      </Label>
                      <Switch
                        id={`${day.value}-closed`}
                        checked={dayHours.isClosed}
                        onCheckedChange={(checked) =>
                          updateDayHours(day.value, 'isClosed', checked)
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <Button onClick={handleSaveCustomHours} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Horários Personalizados
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
