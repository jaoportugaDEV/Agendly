// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { 
  generateClientToken, 
  setClientAuthCookie, 
  removeClientAuthCookie,
  getAuthenticatedClient 
} from '@/lib/utils/jwt'
import { randomBytes } from 'crypto'

/**
 * Registra uma nova conta de cliente
 * Vincula automaticamente agendamentos existentes pelo email ou telefone
 */
export async function registerClient(data: {
  email: string
  password: string
  name: string
  phone: string
}) {
  try {
    const supabase = createPublicClient()

    // Verificar se email já existe
    const { data: existingAccount } = await supabase
      .from('customer_accounts')
      .select('id')
      .eq('email', data.email)
      .single()

    if (existingAccount) {
      return { success: false, error: 'Email já cadastrado' }
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Procurar por clientes existentes com mesmo email ou telefone (de agendamentos anteriores)
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('id, email, phone, business_id')
      .or(`email.eq.${data.email},phone.eq.${data.phone}`)
      .is('deleted_at', null)

    let customerId: string
    let linkedAppointments = 0

    if (existingCustomers && existingCustomers.length > 0) {
      // Cliente já existe de agendamentos anteriores!
      // Usar o primeiro encontrado e atualizar os dados
      customerId = existingCustomers[0].id
      linkedAppointments = existingCustomers.length

      // Atualizar informações do cliente
      await supabase
        .from('customers')
        .update({
          email: data.email,
          name: data.name,
          phone: data.phone
        })
        .eq('id', customerId)

      console.log(`✅ Cliente existente encontrado: ${customerId}, vinculando ${linkedAppointments} registro(s)`)
    } else {
      // Criar novo cliente
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          email: data.email,
          name: data.name,
          phone: data.phone
        })
        .select()
        .single()

      if (customerError || !customer) {
        console.error('Erro ao criar customer:', customerError)
        return { success: false, error: 'Erro ao criar conta' }
      }

      customerId = customer.id
      console.log(`✅ Novo cliente criado: ${customerId}`)
    }

    // Gerar token de verificação
    const verificationToken = randomBytes(32).toString('hex')

    // Criar conta de cliente
    const { data: account, error: accountError } = await supabase
      .from('customer_accounts')
      .insert({
        customer_id: customerId,
        email: data.email,
        password_hash: passwordHash,
        verification_token: verificationToken,
        email_verified: false
      })
      .select()
      .single()

    if (accountError || !account) {
      console.error('Erro ao criar account:', accountError)
      return { success: false, error: 'Erro ao criar conta' }
    }

    // Fazer login automático após registro
    const token = generateClientToken({
      customerId: customerId,
      email: data.email,
    })

    await setClientAuthCookie(token)

    // TODO: Enviar email de boas-vindas (implementar depois)

    return { 
      success: true, 
      data: { 
        customerId: customerId,
        email: data.email,
        linkedAppointments
      },
      message: linkedAppointments > 0 
        ? `Conta criada! Encontramos ${linkedAppointments} agendamento(s) anterior(es) vinculado(s) à sua conta.`
        : 'Conta criada com sucesso!'
    }
  } catch (error) {
    console.error('Erro ao registrar cliente:', error)
    return { success: false, error: 'Erro ao criar conta' }
  }
}

/**
 * Login de cliente
 */
export async function loginClient(email: string, password: string) {
  try {
    const supabase = createPublicClient()

    // Buscar conta
    const { data: account, error } = await supabase
      .from('customer_accounts')
      .select('*, customer:customers(*)')
      .eq('email', email)
      .single()

    if (error || !account) {
      return { success: false, error: 'Email ou senha incorretos' }
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, account.password_hash)
    if (!passwordMatch) {
      return { success: false, error: 'Email ou senha incorretos' }
    }

    // Atualizar último login
    await supabase
      .from('customer_accounts')
      .update({ last_login: new Date().toISOString() })
      .eq('id', account.id)

    // Gerar token JWT
    const token = generateClientToken({
      customerId: account.customer_id,
      customerAccountId: account.id,
      email: account.email
    })

    // Salvar em cookie
    await setClientAuthCookie(token)

    return { 
      success: true, 
      data: {
        customerId: account.customer_id,
        email: account.email,
        name: account.customer?.name
      }
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    return { success: false, error: 'Erro ao fazer login' }
  }
}

/**
 * Logout de cliente
 */
export async function logoutClient() {
  try {
    await removeClientAuthCookie()
    return { success: true }
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    return { success: false, error: 'Erro ao fazer logout' }
  }
}

/**
 * Solicita reset de senha
 */
export async function requestPasswordReset(email: string) {
  try {
    const supabase = createPublicClient()

    const { data: account } = await supabase
      .from('customer_accounts')
      .select('id')
      .eq('email', email)
      .single()

    if (!account) {
      // Não revelar se email existe ou não por segurança
      return { success: true, message: 'Se o email existe, você receberá um link de recuperação' }
    }

    // Gerar token de reset
    const resetToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600000) // 1 hora

    await supabase
      .from('customer_accounts')
      .update({
        reset_password_token: resetToken,
        reset_password_expires: expiresAt.toISOString()
      })
      .eq('id', account.id)

    // TODO: Enviar email com link de reset (implementar na FASE 10)
    // Link: /recuperar-senha/[resetToken]

    return { success: true, message: 'Se o email existe, você receberá um link de recuperação' }
  } catch (error) {
    console.error('Erro ao solicitar reset:', error)
    return { success: false, error: 'Erro ao processar solicitação' }
  }
}

/**
 * Reset de senha com token
 */
export async function resetPassword(token: string, newPassword: string) {
  try {
    const supabase = createPublicClient()

    // Buscar conta pelo token
    const { data: account } = await supabase
      .from('customer_accounts')
      .select('id, reset_password_expires')
      .eq('reset_password_token', token)
      .single()

    if (!account) {
      return { success: false, error: 'Token inválido ou expirado' }
    }

    // Verificar se token expirou
    if (new Date(account.reset_password_expires) < new Date()) {
      return { success: false, error: 'Token expirado' }
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Atualizar senha e limpar token
    await supabase
      .from('customer_accounts')
      .update({
        password_hash: passwordHash,
        reset_password_token: null,
        reset_password_expires: null
      })
      .eq('id', account.id)

    return { success: true, message: 'Senha alterada com sucesso' }
  } catch (error) {
    console.error('Erro ao resetar senha:', error)
    return { success: false, error: 'Erro ao alterar senha' }
  }
}

/**
 * Busca perfil do cliente autenticado
 */
export async function getClientProfile() {
  try {
    const auth = await getAuthenticatedClient()
    if (!auth) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = createPublicClient()

    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', auth.customerId)
      .single()

    if (error || !customer) {
      return { success: false, error: 'Cliente não encontrado' }
    }

    return { success: true, data: customer }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return { success: false, error: 'Erro ao buscar perfil' }
  }
}

/**
 * Atualiza perfil do cliente
 */
export async function updateClientProfile(data: {
  name?: string
  phone?: string
}) {
  try {
    const auth = await getAuthenticatedClient()
    if (!auth) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = createPublicClient()

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.phone) updateData.phone = data.phone

    const { error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', auth.customerId)

    if (error) {
      return { success: false, error: 'Erro ao atualizar perfil' }
    }

    return { success: true, message: 'Perfil atualizado com sucesso' }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { success: false, error: 'Erro ao atualizar perfil' }
  }
}

/**
 * Altera senha do cliente
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const auth = await getAuthenticatedClient()
    if (!auth) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = createPublicClient()

    // Buscar conta
    const { data: account } = await supabase
      .from('customer_accounts')
      .select('password_hash')
      .eq('id', auth.customerAccountId)
      .single()

    if (!account) {
      return { success: false, error: 'Conta não encontrada' }
    }

    // Verificar senha atual
    const passwordMatch = await bcrypt.compare(currentPassword, account.password_hash)
    if (!passwordMatch) {
      return { success: false, error: 'Senha atual incorreta' }
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Atualizar senha
    await supabase
      .from('customer_accounts')
      .update({ password_hash: passwordHash })
      .eq('id', auth.customerAccountId)

    return { success: true, message: 'Senha alterada com sucesso' }
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    return { success: false, error: 'Erro ao alterar senha' }
  }
}

/**
 * Atualiza informações do perfil do cliente
 */
export async function updateClientProfile(data: {
  name?: string
  email?: string
  phone?: string
}) {
  try {
    const auth = await getAuthenticatedClient()
    if (!auth) {
      return { success: false, error: 'Cliente não autenticado' }
    }

    const supabase = createPublicClient()

    // Atualizar dados do customer
    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email
    if (data.phone) updateData.phone = data.phone

    const { error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', auth.customerId)

    if (error) {
      console.error('Erro ao atualizar perfil:', error)
      return { success: false, error: 'Erro ao atualizar perfil' }
    }

    return { success: true, message: 'Perfil atualizado com sucesso' }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { success: false, error: 'Erro ao atualizar perfil' }
  }
}

/**
 * Busca dados do perfil do cliente autenticado
 */
export async function getClientProfile() {
  try {
    const auth = await getAuthenticatedClient()
    if (!auth) {
      return { success: false, error: 'Cliente não autenticado', data: null }
    }

    const supabase = createPublicClient()

    const { data, error } = await supabase
      .from('customers')
      .select('id, name, email, phone, avatar_url')
      .eq('id', auth.customerId)
      .single()

    if (error) {
      console.error('Erro ao buscar perfil:', error)
      return { success: false, error: 'Erro ao buscar perfil', data: null }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return { success: false, error: 'Erro ao buscar perfil', data: null }
  }
}
