// @ts-nocheck
'use server'

import { createClient, createPublicClient } from '@/lib/supabase/server'
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
      absence_reason,
      absence_start_date,
      absence_end_date,
      absence_notes,
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
  console.log('🔵 inviteStaffMember called for business:', businessId, 'input:', input)
  const supabase = await createClient()

  // Validar input
  const validation = inviteStaffSchema.safeParse(input)
  if (!validation.success) {
    console.error('❌ Validation failed:', validation.error)
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  console.log('✅ Validation passed:', validation.data)
  const { email, fullName, password, role } = validation.data

  // Usar service role para verificações
  const serviceSupabase = createPublicClient()

  // Verificar se o usuário já existe na tabela users
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existingUser) {
    console.log('✅ User already exists in users table:', existingUser.id)
    
    // Verificar se já é membro do negócio
    const { data: existingMember } = await supabase
      .from('business_members')
      .select('id')
      .eq('business_id', businessId)
      .eq('user_id', existingUser.id)
      .single()

    if (existingMember) {
      console.log('❌ User is already a member')
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
      console.error('❌ Erro ao adicionar membro:', memberError)
      return { success: false, error: 'Erro ao adicionar membro' }
    }

    console.log('✅ Member added successfully')
    revalidatePath(`/dashboard/${businessId}/equipe`)
    return { success: true, message: 'Membro adicionado com sucesso' }
  }

  // Usuário não existe na tabela users - verificar se existe no Auth
  console.log('📝 User not in users table, checking auth...')
  
  try {
    // Verificar se usuário existe no Auth
    const { data: authUsersList } = await serviceSupabase.auth.admin.listUsers()
    const existingAuthUser = authUsersList?.users?.find(u => u.email === email)

    if (existingAuthUser) {
      console.log('✅ User exists in auth but not in users table, deleting old auth user...')
      
      // Deletar o usuário antigo do Auth para poder recriar
      const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(existingAuthUser.id)
      
      if (deleteError) {
        console.error('❌ Error deleting old auth user:', deleteError)
        return { success: false, error: 'Erro ao limpar usuário anterior. Tente novamente.' }
      }
      
      console.log('✅ Old auth user deleted, will create new one')
      // Aguardar um pouco para garantir que o delete foi processado
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Criar usuário no Supabase Auth (admin API) com senha
    console.log('📝 Creating new auth user...')
    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.createUser({
      email,
      password, // Senha definida pelo admin
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError || !authUser.user) {
      console.error('❌ Error creating auth user:', authError)
      return { 
        success: false, 
        error: 'Erro ao criar usuário: ' + (authError?.message || 'Erro desconhecido')
      }
    }

    console.log('✅ Auth user created:', authUser.user.id)

    // A tabela users deve ser populada automaticamente por um trigger
    // Aguardar um pouco para o trigger executar
    await new Promise(resolve => setTimeout(resolve, 500))

    // Adicionar como membro
    const { error: memberError } = await supabase
      .from('business_members')
      .insert({
        business_id: businessId,
        user_id: authUser.user.id,
        role,
        active: true,
      })

    if (memberError) {
      console.error('❌ Error adding member:', memberError)
      return { success: false, error: 'Erro ao adicionar membro: ' + memberError.message }
    }

    console.log('✅ Member added successfully')
    revalidatePath(`/dashboard/${businessId}/equipe`)
    return { success: true, message: 'Funcionário adicionado com sucesso' }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return { success: false, error: 'Erro inesperado ao criar funcionário' }
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
  console.log('🔵 removeStaffMember called:', { businessId, memberId })
  const supabase = await createClient()

  // Buscar informações do membro incluindo user_id e joined_at
  const { data: member } = await supabase
    .from('business_members')
    .select('role, active, user_id, joined_at')
    .eq('id', memberId)
    .single()

  if (!member) {
    return { success: false, error: 'Membro não encontrado' }
  }

  // Verificar se é o fundador (primeiro admin)
  if (member.role === 'admin') {
    const { data: firstAdmin } = await supabase
      .from('business_members')
      .select('id, user_id')
      .eq('business_id', businessId)
      .eq('role', 'admin')
      .order('joined_at', { ascending: true })
      .limit(1)
      .single()

    if (firstAdmin && firstAdmin.user_id === member.user_id) {
      return {
        success: false,
        error: 'Não é possível remover o administrador fundador da empresa',
      }
    }

    // Verificar se é o último admin
    if (member.active === true) {
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

  // Remover membro do banco
  const { error: memberError } = await supabase
    .from('business_members')
    .delete()
    .eq('id', memberId)
    .eq('business_id', businessId)

  if (memberError) {
    console.error('❌ Erro ao remover membro:', memberError)
    return { success: false, error: 'Erro ao remover membro' }
  }

  console.log('✅ Member removed from business_members')

  // Deletar usuário do Supabase Auth (usando service role)
  try {
    const serviceSupabase = createPublicClient()
    const { error: authError } = await serviceSupabase.auth.admin.deleteUser(member.user_id)

    if (authError) {
      console.error('⚠️ Warning: Could not delete auth user:', authError)
      // Não falhar a operação se não conseguir deletar do auth
    } else {
      console.log('✅ User deleted from auth')
    }
  } catch (error) {
    console.error('⚠️ Error deleting auth user:', error)
    // Continuar mesmo se falhar
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

/**
 * Desativa um funcionário com motivo e período de ausência
 */
export async function deactivateStaffMember(
  businessId: string,
  memberId: string,
  absenceData: {
    reason: string
    startDate: string
    endDate: string | null
    notes: string | null
  }
) {
  console.log('🔵 deactivateStaffMember called:', { businessId, memberId, absenceData })
  const supabase = await createClient()

  // Atualizar membro com dados de ausência
  const { error } = await supabase
    .from('business_members')
    .update({
      active: false,
      absence_reason: absenceData.reason,
      absence_start_date: absenceData.startDate,
      absence_end_date: absenceData.endDate,
      absence_notes: absenceData.notes,
    })
    .eq('id', memberId)
    .eq('business_id', businessId)

  if (error) {
    console.error('❌ Erro ao desativar membro:', error)
    return { success: false, error: 'Erro ao desativar funcionário' }
  }

  console.log('✅ Member deactivated with absence data')
  revalidatePath(`/dashboard/${businessId}/equipe`)
  return { success: true }
}

/**
 * Reativa um funcionário e limpa dados de ausência
 */
export async function reactivateStaffMember(
  businessId: string,
  memberId: string
) {
  console.log('🔵 reactivateStaffMember called:', { businessId, memberId })
  const supabase = await createClient()

  // Reativar e limpar dados de ausência
  const { error } = await supabase
    .from('business_members')
    .update({
      active: true,
      absence_reason: null,
      absence_start_date: null,
      absence_end_date: null,
      absence_notes: null,
    })
    .eq('id', memberId)
    .eq('business_id', businessId)

  if (error) {
    console.error('❌ Erro ao reativar membro:', error)
    return { success: false, error: 'Erro ao reativar funcionário' }
  }

  console.log('✅ Member reactivated')
  revalidatePath(`/dashboard/${businessId}/equipe`)
  return { success: true }
}
