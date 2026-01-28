// @ts-nocheck
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createBusinessSchema } from '@/lib/validations/business'
import type { CreateBusinessInput } from '@/lib/validations/business'
import { generateSlug } from '@/lib/utils/slug'
import { getUser } from './auth'

export async function createBusiness(data: CreateBusinessInput) {
  const validated = createBusinessSchema.parse(data)
  const supabase = await createClient()
  const user = await getUser()

  console.log('=== DEBUG CREATE BUSINESS ===')
  console.log('User:', user?.id)
  console.log('Data:', validated)

  if (!user) {
    console.error('Usuário não autenticado!')
    return { error: 'Não autenticado' }
  }

  // Generate slug from business name
  const slug = await generateUniqueBusinessSlug(validated.name)
  console.log('Slug gerado:', slug)

  console.log('Tentando inserir business...')
  
  const { data: business, error } = await (supabase
    .from('businesses') as any)
    .insert({
      name: validated.name,
      slug,
      country_code: validated.countryCode,
      business_type: validated.businessType,
      description: validated.description,
      phone: validated.phone,
      email: validated.email,
      address: validated.address,
      city: validated.city,
      state: validated.state,
      postal_code: validated.postalCode,
      website: validated.website,
    })
    .select()
    .single()

  console.log('Resultado INSERT:', { business, error })

  if (error) {
    console.error('Erro ao inserir business:', error)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(`/${business.id}`)
}

export async function getUserBusinesses(): Promise<Array<{
  id: string
  name: string
  slug: string
  [key: string]: any
}>> {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      business_members!inner (
        role,
        user_id
      )
    `)
    .eq('business_members.user_id', user.id)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching businesses:', error)
    return []
  }

  return data as any
}

async function generateUniqueBusinessSlug(name: string): Promise<string> {
  const supabase = await createClient()
  let slug = generateSlug(name)
  let counter = 1

  while (true) {
    const { data } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!data) {
      return slug
    }

    slug = `${generateSlug(name)}-${counter}`
    counter++
  }
}

export async function getBusinessBySlug(slug: string) {
  const { createPublicClient } = await import('@/lib/supabase/server')
  const supabase = createPublicClient()

  // Get business basic info
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, slug, description, logo_url, timezone, currency')
    .eq('slug', slug)
    .eq('active', true)
    .is('deleted_at', null)
    .single()

  if (businessError || !business) {
    console.error('Error fetching business:', businessError)
    return { success: false, error: 'Empresa não encontrada' }
  }

  // Get active services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes, price, currency')
    .eq('business_id', business.id)
    .eq('active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (servicesError) {
    console.error('Error fetching services:', servicesError)
    return { success: false, error: 'Erro ao buscar serviços' }
  }

  // Get active promotions for services
  const { data: promotions, error: promotionsError } = await supabase
    .from('promotions')
    .select('id, target_id, promotional_price, discount_percentage, weekdays, recurrence_type, start_date, end_date')
    .eq('business_id', business.id)
    .eq('promotion_type', 'service')
    .eq('active', true)
    .is('deleted_at', null)

  if (promotionsError) {
    console.error('Error fetching promotions:', promotionsError)
  }

  // Map promotions to services
  const servicesWithPromotions = (services || []).map((service: any) => {
    const promotion = promotions?.find((p: any) => p.target_id === service.id)
    
    if (promotion) {
      // Validate if promotion is currently valid (for date_range type)
      let isValid = true
      if (promotion.recurrence_type === 'date_range' && promotion.start_date && promotion.end_date) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const start = new Date(promotion.start_date)
        const end = new Date(promotion.end_date)
        isValid = today >= start && today <= end
      }
      
      return {
        ...service,
        promotion: isValid ? {
          id: promotion.id,
          promotional_price: promotion.promotional_price,
          discount_percentage: promotion.discount_percentage,
          weekdays: promotion.weekdays,
          recurrence_type: promotion.recurrence_type,
          start_date: promotion.start_date,
          end_date: promotion.end_date,
        } : null
      }
    }
    
    return { ...service, promotion: null }
  })

  // Get active staff
  const { data: members, error: membersError } = await supabase
    .from('business_members')
    .select(`
      user_id,
      users!inner(id, full_name, avatar_url)
    `)
    .eq('business_id', business.id)
    .eq('active', true)

  if (membersError) {
    console.error('Error fetching staff:', membersError)
    return { success: false, error: 'Erro ao buscar equipe' }
  }

  // Transform staff data
  const staff = (members || []).map((m: any) => ({
    id: m.users.id,
    name: m.users.full_name,
    avatar_url: m.users.avatar_url,
  }))

  return {
    success: true,
    data: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      description: business.description,
      logo_url: business.logo_url,
      timezone: business.timezone,
      currency: business.currency,
      services: servicesWithPromotions,
      staff,
    },
  }
}

/**
 * Soft delete a business (sets deleted_at timestamp)
 * Only the owner/admin can delete
 */
export async function deleteBusiness(businessId: string) {
  console.log('🔵 deleteBusiness called for:', businessId)
  const supabase = await createClient()
  const user = await getUser()

  if (!user) {
    return { success: false, error: 'Não autenticado' }
  }

  // Verificar se o usuário é admin do business
  const { data: membership } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .eq('active', true)
    .single()

  if (!membership || membership.role !== 'admin') {
    return { success: false, error: 'Apenas administradores podem excluir a empresa' }
  }

  // Soft delete (set deleted_at)
  const { error } = await supabase
    .from('businesses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', businessId)

  if (error) {
    console.error('❌ Error deleting business:', error)
    return { success: false, error: 'Erro ao excluir empresa' }
  }

  console.log('✅ Business deleted successfully')
  
  // Buscar outra empresa do usuário para redirecionar
  const businesses = await getUserBusinesses()
  
  revalidatePath('/', 'layout')
  
  if (businesses.length > 0) {
    redirect(`/${businesses[0].id}`)
  } else {
    redirect('/onboarding')
  }
}
