// @ts-nocheck
'use server'

import { createPublicClient } from '@/lib/supabase/server'
import { publicBookingSchema } from '@/lib/validations/public-booking'
import { validateTimeSlot } from './availability'
import { revalidatePath } from 'next/cache'

/**
 * Create a public appointment (from booking page)
 */
export async function createPublicAppointment(
  businessSlug: string,
  input: unknown
) {
  const supabase = createPublicClient()

  console.log('🔵 createPublicAppointment called with:', { businessSlug, input })

  try {
    // 1. Validate input
    const validation = publicBookingSchema.safeParse(input)
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error)
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Dados inválidos',
      }
    }

    console.log('✅ Validation passed:', validation.data)

    const { serviceId, staffId, startTime, customer } = validation.data

    // 2. Get business by slug
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, timezone, currency')
      .eq('slug', businessSlug)
      .eq('active', true)
      .is('deleted_at', null)
      .single()

    if (businessError || !business) {
      console.error('❌ Business not found:', businessError)
      return {
        success: false,
        error: 'Empresa não encontrada',
      }
    }

    const businessId = business.id
    console.log('✅ Business found:', businessId)

    // 3. Validate that the time slot is still available
    const validation_result = await validateTimeSlot({
      businessId,
      staffId,
      serviceId,
      startTime,
    })

    if (!validation_result.success || !validation_result.available) {
      console.error('❌ Time slot validation failed:', validation_result)
      return {
        success: false,
        error: validation_result.reason || 'Horário não disponível',
      }
    }

    console.log('✅ Time slot is available')

    // 4. Get service details
    console.log('🔍 Getting service details for:', serviceId)
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes, price, currency')
      .eq('id', serviceId)
      .single()

    if (serviceError || !service) {
      console.error('❌ Service not found:', serviceError)
      return {
        success: false,
        error: 'Serviço não encontrado',
      }
    }

    console.log('✅ Service found:', service)

    // 4.5. Check for active promotion
    console.log('🔍 Checking for active promotion for service:', serviceId)
    const { data: promotion, error: promotionError } = await supabase
      .from('promotions')
      .select('id, promotional_price, weekdays, recurrence_type, start_date, end_date')
      .eq('business_id', businessId)
      .eq('target_id', serviceId)
      .eq('promotion_type', 'service')
      .eq('active', true)
      .is('deleted_at', null)
      .single()

    let finalPrice = service.price

    if (promotion && !promotionError) {
      console.log('🎉 Promotion found:', promotion)
      
      // Validate if the selected date is valid for the promotion
      const appointmentDate = new Date(startTime)
      const dayOfWeek = appointmentDate.getDay()
      
      let isValidForPromotion = promotion.weekdays.includes(dayOfWeek)
      
      // If date_range type, also check date validity
      if (isValidForPromotion && promotion.recurrence_type === 'date_range') {
        if (promotion.start_date && promotion.end_date) {
          const dateOnly = new Date(appointmentDate.toISOString().split('T')[0])
          const start = new Date(promotion.start_date)
          const end = new Date(promotion.end_date)
          isValidForPromotion = dateOnly >= start && dateOnly <= end
        } else {
          isValidForPromotion = false
        }
      }
      
      if (isValidForPromotion) {
        finalPrice = promotion.promotional_price
        console.log('✅ Promotional price applied:', finalPrice)
      } else {
        console.log('⚠️ Promotion not valid for this date')
      }
    } else {
      console.log('ℹ️ No active promotion found for this service')
    }

    // 5. Find or create customer
    console.log('🔍 Finding or creating customer:', customer.phone)
    let customerId: string

    // Try to find existing customer by phone
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', businessId)
      .eq('phone', customer.phone)
      .is('deleted_at', null)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id
      console.log('✅ Existing customer found:', customerId)

      // Update customer info if provided
      await supabase
        .from('customers')
        .update({
          name: customer.name,
          email: customer.email || null,
          notes: customer.notes || null,
        })
        .eq('id', customerId)
    } else {
      console.log('📝 Creating new customer')
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          business_id: businessId,
          name: customer.name,
          email: customer.email || null,
          phone: customer.phone,
          notes: customer.notes || null,
        })
        .select('id')
        .single()

      if (customerError || !newCustomer) {
        console.error('❌ Error creating customer:', customerError)
        return {
          success: false,
          error: 'Erro ao criar cliente',
        }
      }

      customerId = newCustomer.id
      console.log('✅ New customer created:', customerId)
    }

    // 6. Calculate end time
    const startDate = new Date(startTime)
    const endDate = new Date(
      startDate.getTime() + service.duration_minutes * 60000
    )

    // 7. Create appointment with source='public'
    console.log('📝 Creating appointment with data:', {
      business_id: businessId,
      staff_id: staffId,
      customer_id: customerId,
      service_id: serviceId,
      start_time: startTime,
      end_time: endDate.toISOString(),
      status: 'pending',
      price: finalPrice,
      currency: service.currency,
      source: 'public',
    })

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        business_id: businessId,
        staff_id: staffId,
        customer_id: customerId,
        service_id: serviceId,
        start_time: startTime,
        end_time: endDate.toISOString(),
        status: 'pending',
        price: finalPrice,
        currency: service.currency,
        source: 'public',
      })
      .select('id')
      .single()

    if (appointmentError) {
      console.error('❌ Error creating appointment:', appointmentError)
      
      // Check if it's a conflict error
      if (appointmentError.message.includes('Conflito de horário')) {
        return {
          success: false,
          error: 'Este horário acabou de ser reservado. Por favor, escolha outro.',
        }
      }

      return {
        success: false,
        error: 'Erro ao criar agendamento',
      }
    }

    // Revalidate the dashboard pages
    revalidatePath(`/${businessId}/agenda`)

    console.log('✅ Appointment created successfully:', appointment.id)

    return {
      success: true,
      data: {
        appointmentId: appointment.id,
        businessName: business.name,
      },
    }
  } catch (error) {
    console.error('❌ Unexpected error in createPublicAppointment:', error)
    return {
      success: false,
      error: 'Erro inesperado ao criar agendamento',
    }
  }
}

/**
 * Find available staff member for a given time slot
 * Used when user selects "any available" staff
 */
export async function findAvailableStaff(params: {
  businessSlug: string
  serviceId: string
  startTime: string
}): Promise<{ success: boolean; staffId?: string; error?: string }> {
  const supabase = createPublicClient()
  const { businessSlug, serviceId, startTime } = params

  try {
    // Get business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', businessSlug)
      .eq('active', true)
      .is('deleted_at', null)
      .single()

    if (businessError || !business) {
      return { success: false, error: 'Empresa não encontrada' }
    }

    const businessId = business.id

    // Get all active staff
    const { data: members, error: membersError } = await supabase
      .from('business_members')
      .select('user_id')
      .eq('business_id', businessId)
      .eq('active', true)

    if (membersError || !members || members.length === 0) {
      return { success: false, error: 'Nenhum profissional disponível' }
    }

    // Check each staff member for availability
    for (const member of members) {
      const validation = await validateTimeSlot({
        businessId,
        staffId: member.user_id,
        serviceId,
        startTime,
      })

      if (validation.success && validation.available) {
        return {
          success: true,
          staffId: member.user_id,
        }
      }
    }

    return {
      success: false,
      error: 'Nenhum profissional disponível neste horário',
    }
  } catch (error) {
    console.error('Error finding available staff:', error)
    return { success: false, error: 'Erro ao buscar profissional' }
  }
}
