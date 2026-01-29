'use server'

import { createClient } from '@/lib/supabase/server'
import { validateAvatarFile, generateAvatarFileName } from '@/lib/validations/avatar'
import { revalidatePath } from 'next/cache'
import { AvatarUploadResult } from '@/types/shared'

/**
 * Upload de avatar para usuários (admin/staff)
 * @param userId - ID do usuário
 * @param formData - FormData contendo o arquivo
 * @returns Resultado do upload
 */
export async function uploadUserAvatar(
  userId: string,
  formData: FormData
): Promise<AvatarUploadResult> {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar se o usuário está tentando atualizar seu próprio avatar
    if (user.id !== userId) {
      return { success: false, error: 'Você só pode atualizar seu próprio avatar' }
    }

    // Extrair arquivo do FormData
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'Nenhum arquivo enviado' }
    }

    // Validar arquivo
    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Remover avatar anterior se existir
    const { data: userData } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (userData?.avatar_url) {
      // Extrair path do avatar anterior
      const oldPath = extractStoragePath(userData.avatar_url)
      if (oldPath) {
        await supabase.storage.from('business-media').remove([oldPath])
      }
    }

    // Gerar nome único para o arquivo
    const fileName = generateAvatarFileName(file.name)
    const filePath = `profiles/${userId}/${fileName}`

    // Upload para storage
    const { error: uploadError } = await supabase.storage
      .from('business-media')
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: 'Erro ao fazer upload da imagem' }
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('business-media')
      .getPublicUrl(filePath)

    // Atualizar tabela users
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      console.error('Update error:', updateError)
      // Tentar remover o arquivo do storage se a atualização falhar
      await supabase.storage.from('business-media').remove([filePath])
      return { success: false, error: 'Erro ao atualizar perfil' }
    }

    // Revalidar paths
    revalidatePath('/', 'layout')

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Avatar upload error:', error)
    return { success: false, error: 'Erro inesperado ao fazer upload' }
  }
}

/**
 * Upload de avatar para clientes
 * @param customerId - ID do cliente
 * @param formData - FormData contendo o arquivo
 * @returns Resultado do upload
 */
export async function uploadCustomerAvatar(
  customerId: string,
  formData: FormData
): Promise<AvatarUploadResult> {
  try {
    const supabase = await createClient()

    // Para clientes, não usamos autenticação do Supabase Auth
    // A verificação de permissão deve ser feita no nível da aplicação

    // Extrair arquivo do FormData
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'Nenhum arquivo enviado' }
    }

    // Validar arquivo
    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Remover avatar anterior se existir
    const { data: customerData } = await supabase
      .from('customers')
      .select('avatar_url')
      .eq('id', customerId)
      .single()

    if (customerData?.avatar_url) {
      const oldPath = extractStoragePath(customerData.avatar_url)
      if (oldPath) {
        await supabase.storage.from('business-media').remove([oldPath])
      }
    }

    // Gerar nome único para o arquivo
    const fileName = generateAvatarFileName(file.name)
    const filePath = `profiles/customer-${customerId}/${fileName}`

    // Upload para storage usando service role para bypass RLS
    const { error: uploadError } = await supabase.storage
      .from('business-media')
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: 'Erro ao fazer upload da imagem' }
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('business-media')
      .getPublicUrl(filePath)

    // Atualizar tabela customers
    const { error: updateError } = await supabase
      .from('customers')
      .update({ avatar_url: publicUrl })
      .eq('id', customerId)

    if (updateError) {
      console.error('Update error:', updateError)
      await supabase.storage.from('business-media').remove([filePath])
      return { success: false, error: 'Erro ao atualizar perfil' }
    }

    // Revalidar paths
    revalidatePath('/', 'layout')

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Customer avatar upload error:', error)
    return { success: false, error: 'Erro inesperado ao fazer upload' }
  }
}

/**
 * Remove avatar do usuário
 * @param userId - ID do usuário
 * @returns Resultado da operação
 */
export async function removeUserAvatar(userId: string): Promise<AvatarUploadResult> {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    if (user.id !== userId) {
      return { success: false, error: 'Você só pode remover seu próprio avatar' }
    }

    // Buscar avatar atual
    const { data: userData } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (!userData?.avatar_url) {
      return { success: true } // Já não tem avatar
    }

    // Extrair path do storage
    const storagePath = extractStoragePath(userData.avatar_url)
    if (storagePath) {
      await supabase.storage.from('business-media').remove([storagePath])
    }

    // Limpar campo no banco
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('id', userId)

    if (updateError) {
      console.error('Update error:', updateError)
      return { success: false, error: 'Erro ao atualizar perfil' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Remove avatar error:', error)
    return { success: false, error: 'Erro ao remover avatar' }
  }
}

/**
 * Remove avatar do cliente
 * @param customerId - ID do cliente
 * @returns Resultado da operação
 */
export async function removeCustomerAvatar(customerId: string): Promise<AvatarUploadResult> {
  try {
    const supabase = await createClient()

    // Buscar avatar atual
    const { data: customerData } = await supabase
      .from('customers')
      .select('avatar_url')
      .eq('id', customerId)
      .single()

    if (!customerData?.avatar_url) {
      return { success: true } // Já não tem avatar
    }

    // Extrair path do storage
    const storagePath = extractStoragePath(customerData.avatar_url)
    if (storagePath) {
      await supabase.storage.from('business-media').remove([storagePath])
    }

    // Limpar campo no banco
    const { error: updateError } = await supabase
      .from('customers')
      .update({ avatar_url: null })
      .eq('id', customerId)

    if (updateError) {
      console.error('Update error:', updateError)
      return { success: false, error: 'Erro ao atualizar perfil' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Remove customer avatar error:', error)
    return { success: false, error: 'Erro ao remover avatar' }
  }
}

/**
 * Extrai o path do storage a partir da URL pública
 * @param publicUrl - URL pública do Supabase Storage
 * @returns Path relativo no storage ou null
 */
function extractStoragePath(publicUrl: string): string | null {
  try {
    // URL format: https://{project}.supabase.co/storage/v1/object/public/business-media/{path}
    const match = publicUrl.match(/\/object\/public\/business-media\/(.+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
