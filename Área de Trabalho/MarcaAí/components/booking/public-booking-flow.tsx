'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ServiceSelector } from './service-selector'
import { StaffSelector } from './staff-selector'
import { DateTimePicker } from './date-time-picker'
import { CustomerForm } from './customer-form'
import { BookingSummary } from './booking-summary'
import { BookingConfirmation } from './booking-confirmation'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { PublicBusinessData } from '@/types/shared'
import { createPublicAppointment, findAvailableStaff } from '@/lib/actions/public-booking'
import { useToast } from '@/hooks/use-toast'

interface PublicBookingFlowProps {
  business: PublicBusinessData
  preselectedServiceId?: string | null
}

type Step = 1 | 2 | 3 | 4 | 5 | 6

export function PublicBookingFlow({ business, preselectedServiceId }: PublicBookingFlowProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)

  // Booking data
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null)
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  })

  // Auto-select service if provided via URL
  useEffect(() => {
    if (preselectedServiceId && business.services.some(s => s.id === preselectedServiceId)) {
      setSelectedServiceId(preselectedServiceId)
    }
  }, [preselectedServiceId, business.services])

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedServiceId !== null
      case 2:
        return selectedStaffId !== null
      case 3:
        return selectedDateTime !== null
      case 4:
        return (
          customerData.name.length >= 2 &&
          customerData.phone.length >= 9 &&
          (!customerData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email))
        )
      case 5:
        return true
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (currentStep === 5) {
      // Submit booking
      await handleSubmit()
    } else {
      setCurrentStep((prev) => (prev + 1) as Step)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
    }
  }

  const handleSubmit = async () => {
    console.log('🔵 handleSubmit called')
    console.log('Selected data:', { selectedServiceId, selectedStaffId, selectedDateTime, customerData })

    if (!selectedServiceId || !selectedStaffId || !selectedDateTime) {
      console.error('❌ Missing required data')
      toast({
        title: 'Erro',
        description: 'Por favor, complete todos os passos.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    console.log('⏳ Loading started')

    try {
      // If "any" staff was selected, find an available one
      let finalStaffId = selectedStaffId
      if (selectedStaffId === 'any') {
        console.log('🔍 Finding available staff...')
        const result = await findAvailableStaff({
          businessSlug: business.slug,
          serviceId: selectedServiceId,
          startTime: selectedDateTime,
        })

        if (!result.success || !result.staffId) {
          console.error('❌ No staff available:', result)
          toast({
            title: 'Erro',
            description: result.error || 'Nenhum profissional disponível',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

        finalStaffId = result.staffId
        console.log('✅ Found staff:', finalStaffId)
      }

      // Create the appointment
      console.log('📝 Creating appointment...')
      const result = await createPublicAppointment(business.slug, {
        serviceId: selectedServiceId,
        staffId: finalStaffId,
        startTime: selectedDateTime,
        customer: {
          name: customerData.name,
          email: customerData.email || undefined,
          phone: customerData.phone,
          notes: customerData.notes || undefined,
        },
      })

      console.log('📥 Result:', result)

      if (result.success && result.data?.appointmentId) {
        console.log('✅ Appointment created successfully!')
        // Redirecionar para página de sucesso com informações
        router.push(`/agendar/${business.slug}/sucesso?id=${result.data.appointmentId}`)
      } else {
        console.error('❌ Failed to create appointment:', result.error)
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao criar agendamento',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('❌ Error submitting booking:', error)
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao criar agendamento',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNewBooking = () => {
    setCurrentStep(1)
    setSelectedServiceId(null)
    setSelectedStaffId(null)
    setSelectedDateTime(null)
    setCustomerData({
      name: '',
      email: '',
      phone: '',
      notes: '',
    })
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Escolha o serviço'
      case 2:
        return 'Escolha o profissional'
      case 3:
        return 'Escolha data e horário'
      case 4:
        return 'Seus dados'
      case 5:
        return 'Confirmar agendamento'
      case 6:
        return 'Agendamento confirmado'
      default:
        return ''
    }
  }

  const selectedService = business.services.find((s) => s.id === selectedServiceId)
  const selectedStaff =
    selectedStaffId === 'any'
      ? 'any'
      : business.staff.find((s) => s.id === selectedStaffId)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Agendar Horário</h1>
        <p className="text-muted-foreground">{business.name}</p>
      </div>

      {/* Progress Steps */}
      {currentStep < 6 && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < 5 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-semibold">{getStepTitle()}</h2>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="mb-8">
        {currentStep === 1 && (
          <ServiceSelector
            services={business.services}
            selectedServiceId={selectedServiceId}
            onSelect={setSelectedServiceId}
            currency={business.currency}
          />
        )}

        {currentStep === 2 && (
          <StaffSelector
            staff={business.staff}
            selectedStaffId={selectedStaffId}
            onSelect={setSelectedStaffId}
          />
        )}

        {currentStep === 3 && selectedServiceId && selectedStaffId && (
          <DateTimePicker
            businessId={business.id}
            serviceId={selectedServiceId}
            staffId={selectedStaffId}
            selectedDateTime={selectedDateTime}
            onSelect={setSelectedDateTime}
          />
        )}

        {currentStep === 4 && (
          <CustomerForm data={customerData} onChange={setCustomerData} />
        )}

        {currentStep === 5 &&
          selectedService &&
          selectedStaff &&
          selectedDateTime && (
            <BookingSummary
              service={selectedService}
              staff={selectedStaff}
              dateTime={selectedDateTime}
              customer={customerData}
              currency={business.currency}
            />
          )}

        {currentStep === 6 && (
          <BookingConfirmation
            businessName={business.name}
            onNewBooking={handleNewBooking}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      {currentStep < 6 && (
        <div className="flex gap-4">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : currentStep === 5 ? (
              'Confirmar Agendamento'
            ) : (
              <>
                Continuar
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
