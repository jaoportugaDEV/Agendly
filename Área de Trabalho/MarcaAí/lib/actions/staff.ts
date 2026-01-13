// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { inviteStaffSchema, updateStaffMemberSchema } from '@/lib/validations/staff'
import { revalidatePath } from 'next/cache'

export async function getBusinessMembers(businessId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('business_members')
    .select(`
      id,
      business_id,
      user_id,
      role,
      active,
      joined_at,
      users (
        id,
        email,
        full_name,
        avatar_url,
        phone
      )
    `)
    .eq('business_id', businessId)
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar membros:', error)
    return { success: false, error: 'Erro ao buscar membros' }
  }

  return { success: true, data }
}

export async function getStaffMembers(businessId: string) {
  const supabase = await createClient()

  // Buscar apenas staff (não admins) ativos
  const { data, error } = await supabase
    .from('business_members')
    .select(`
      id,
      user_id,
      role,
      active,
      users (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('business_id', businessId)
    .eq('active', true)
    .order('users(full_name)', { ascending: true })

  if (error) {
    console.error('Erro ao buscar funcionários:', error)
    return { success: false, error: 'Erro ao buscar funcionários' }
  }

  return { success: true, data }
}

export async function inviteStaffMember(businessId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = inviteStaffSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const { email, fullName, role } = validation.data

  // Verificar se o usuário já existe
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existingUser) {
    // Verificar se já é membro do negócio
    const { data: existingMember } = await supabase
      .from('business_members')
      .select('id')
      .eq('business_id', businessId)
      .eq('user_id', existingUser.id)
      .single()

    if (existingMember) {
      return { success: false, error: 'Usuário já é membro deste negócio' }
    }

    // Adicionar como membro
    const { error: memberError } = await supabase
      .from('business_members')
      .insert({
        business_id: businessId,
        user_id: existingUser.id,
        role,
        active: true,
      })

    if (memberError) {
      console.error('Erro ao adicionar membro:', memberError)
      return { success: false, error: 'Erro ao adicionar membro' }
    }

    revalidatePath(`/dashboard/${businessId}/equipe`)
    return { success: true, message: 'Membro adicionado com sucesso' }
  }

  // Usuário não existe - criar convite (por enquanto, criar usuário temporário)
  // TODO: Implementar sistema de convites por email
  return {
    success: false,
    error: 'Sistema de convites ainda não implementado. O usuário deve se cadastrar primeiro.',
  }
}

export async function updateStaffMember(
  businessId: string,
  memberId: string,
  input: unknown
) {
  const supabase = await createClient()

  // Validar input
  const validation = updateStaffMemberSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const updateData: Record<string, unknown> = {}

  if (validation.data.role !== undefined) {
    updateData.role = validation.data.role
  }
  if (validation.data.active !== undefined) {
    updateData.active = validation.data.active
  }

  // Verificar se há pelo menos um admin ativo
  if (validation.data.active === false || validation.data.role === 'staff') {
    const { data: member } = await supabase
      .from('business_members')
      .select('role, active')
      .eq('id', memberId)
      .single()

    if (member?.role === 'admin' && member?.active === true) {
      // Verificar se há outros admins ativos
      const { data: admins, count } = await supabase
        .from('business_members')
        .select('id', { count: 'exact' })
        .eq('business_id', businessId)
        .eq('role', 'admin')
        .eq('active', true)

      if (count === 1) {
        return {
          success: false,
          error: 'Não é possível remover o último administrador ativo',
        }
      }
    }
  }

  // Atualizar membro
  const { error } = await supabase
    .from('business_members')
    .update(updateData)
    .eq('id', memberId)
    .eq('business_id', businessId)

  if (error) {
    console.error('Erro ao atualizar membro:', error)
    return { success: false, error: 'Erro ao atualizar membro' }
  }

  revalidatePath(`/dashboard/${businessId}/equipe`)
  return { success: true }
}

export async function removeStaffMember(businessId: string, memberId: string) {
  const supabase = await createClient()

  // Verificar se é o último admin
  const { data: member } = await supabase
    .from('business_members')
    .select('role, active')
    .eq('id', memberId)
    .single()

  if (member?.role === 'admin' && member?.active === true) {
    const { data: admins, count } = await supabase
      .from('business_members')
      .select('id', { count: 'exact' })
      .eq('business_id', businessId)
      .eq('role', 'admin')
      .eq('active', true)

    if (count === 1) {
      return {
        success: false,
        error: 'Não é possível remover o último administrador',
      }
    }
  }

  // Remover membro
  const { error } = await supabase
    .from('business_members')
    .delete()
    .eq('id', memberId)
    .eq('business_id', businessId)

  if (error) {
    console.error('Erro ao remover membro:', error)
    return { success: false, error: 'Erro ao remover membro' }
  }

  revalidatePath(`/dashboard/${businessId}/equipe`)
  return { success: true }
}

export async function toggleStaffStatus(
  businessId: string,
  memberId: string,
  active: boolean
) {
  return updateStaffMember(businessId, memberId, { active })
}
