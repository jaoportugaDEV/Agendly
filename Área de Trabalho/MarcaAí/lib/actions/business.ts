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
