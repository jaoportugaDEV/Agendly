'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema } from '@/lib/validations/auth'
import type { LoginInput, SignupInput } from '@/lib/validations/auth'

export async function login(data: LoginInput) {
  const validated = loginSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.email,
    password: validated.password,
  })

  if (error) {
    return { error: error.message }
  }

  // Get user membership to redirect appropriately
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: membership } = await supabase
      .from('business_members')
      .select('business_id, role')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (membership) {
      revalidatePath('/', 'layout')
      // Staff sees their own schedule, admin sees full dashboard
      if (membership.role === 'staff') {
        redirect(`/${membership.business_id}/minha-agenda`)
      } else {
        redirect(`/${membership.business_id}/agenda`)
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(data: SignupInput) {
  const validated = signupSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: validated.email,
    password: validated.password,
    options: {
      data: {
        full_name: validated.fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Get user's business membership (role and business_id)
 * Returns the first active membership found
 */
export async function getUserMembership() {
  const supabase = await createClient()
  const user = await getUser()
  
  if (!user) {
    return null
  }

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id, role, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .single()

  return membership
}
