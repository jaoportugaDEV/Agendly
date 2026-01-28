// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from './auth'
import { revalidatePath } from 'next/cache'

/**
 * Busca todos os pacotes de um negócio
 */
export async function getBusinessPackages(businessId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('service_packages')
      .select(`
        *,
        services:package_services(
          service:services(id, name, price, duration_minutes)
        )
      `)
      .eq('business_id', businessId)
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar pacotes:', error)
      return { success: false, error: 'Erro ao buscar pacotes' }
    }

    // Formatar dados
    const packages = data?.map(pkg => ({
      ...pkg,
      services: pkg.services?.map((s: any) => s.service) || []
    })) || []

    return { success: true, data: packages }
  } catch (error) {
    console.error('Erro ao buscar pacotes:', error)
    return { success: false, error: 'Erro ao buscar pacotes' }
  }
}

/**
 * Cria um novo pacote
 */
export async function createPackage(businessId: string, data: {
  name: string
  description?: string
  originalPrice: number
  packagePrice: number
  validityDays?: number
  maxUses?: number
  serviceIds: string[]
}) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Verificar se é admin
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { success: false, error: 'Sem permissão' }
    }

    // Validações
    if (!data.name || data.serviceIds.length === 0) {
      return { success: false, error: 'Nome e serviços são obrigatórios' }
    }

    if (data.packagePrice >= data.originalPrice) {
      return { success: false, error: 'Preço do pacote deve ser menor que o preço original' }
    }

    // Criar pacote
    const { data: package_, error: packageError } = await supabase
      .from('service_packages')
      .insert({
        business_id: businessId,
        name: data.name,
        description: data.description,
        original_price: data.originalPrice,
        package_price: data.packagePrice,
        validity_days: data.validityDays,
        max_uses: data.maxUses,
        active: true
      })
      .select()
      .single()

    if (packageError || !package_) {
      console.error('Erro ao criar pacote:', packageError)
      return { success: false, error: 'Erro ao criar pacote' }
    }

    // Adicionar serviços ao pacote
    const packageServices = data.serviceIds.map(serviceId => ({
      package_id: package_.id,
      service_id: serviceId
    }))

    const { error: servicesError } = await supabase
      .from('package_services')
      .insert(packageServices)

    if (servicesError) {
      console.error('Erro ao adicionar serviços:', servicesError)
      // Rollback: deletar pacote
      await supabase.from('service_packages').delete().eq('id', package_.id)
      return { success: false, error: 'Erro ao adicionar serviços ao pacote' }
    }

    revalidatePath(`/${businessId}/pacotes`)
    return { success: true, data: package_, message: 'Pacote criado com sucesso' }
  } catch (error) {
    console.error('Erro ao criar pacote:', error)
    return { success: false, error: 'Erro ao criar pacote' }
  }
}

/**
 * Atualiza um pacote
 */
export async function updatePackage(packageId: string, data: {
  name?: string
  description?: string
  originalPrice?: number
  packagePrice?: number
  validityDays?: number
  maxUses?: number
  active?: boolean
  serviceIds?: string[]
}) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Buscar pacote para verificar permissão
    const { data: package_, error: packageError } = await supabase
      .from('service_packages')
      .select('business_id')
      .eq('id', packageId)
      .single()

    if (packageError || !package_) {
      return { success: false, error: 'Pacote não encontrado' }
    }

    // Verificar se é admin
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', package_.business_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { success: false, error: 'Sem permissão' }
    }

    // Atualizar pacote
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.originalPrice !== undefined) updateData.original_price = data.originalPrice
    if (data.packagePrice !== undefined) updateData.package_price = data.packagePrice
    if (data.validityDays !== undefined) updateData.validity_days = data.validityDays
    if (data.maxUses !== undefined) updateData.max_uses = data.maxUses
    if (data.active !== undefined) updateData.active = data.active

    const { error: updateError } = await supabase
      .from('service_packages')
      .update(updateData)
      .eq('id', packageId)

    if (updateError) {
      return { success: false, error: 'Erro ao atualizar pacote' }
    }

    // Atualizar serviços se fornecidos
    if (data.serviceIds) {
      // Deletar serviços antigos
      await supabase
        .from('package_services')
        .delete()
        .eq('package_id', packageId)

      // Adicionar novos serviços
      const packageServices = data.serviceIds.map(serviceId => ({
        package_id: packageId,
        service_id: serviceId
      }))

      await supabase
        .from('package_services')
        .insert(packageServices)
    }

    revalidatePath('/pacotes')
    return { success: true, message: 'Pacote atualizado com sucesso' }
  } catch (error) {
    console.error('Erro ao atualizar pacote:', error)
    return { success: false, error: 'Erro ao atualizar pacote' }
  }
}

/**
 * Deleta (desativa) um pacote
 */
export async function deletePackage(packageId: string) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Buscar pacote
    const { data: package_ } = await supabase
      .from('service_packages')
      .select('business_id')
      .eq('id', packageId)
      .single()

    if (!package_) {
      return { success: false, error: 'Pacote não encontrado' }
    }

    // Verificar se é admin
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', package_.business_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { success: false, error: 'Sem permissão' }
    }

    // Desativar
    const { error } = await supabase
      .from('service_packages')
      .update({ active: false })
      .eq('id', packageId)

    if (error) {
      return { success: false, error: 'Erro ao deletar pacote' }
    }

    revalidatePath('/pacotes')
    return { success: true, message: 'Pacote removido com sucesso' }
  } catch (error) {
    console.error('Erro ao deletar pacote:', error)
    return { success: false, error: 'Erro ao deletar pacote' }
  }
}

/**
 * Busca créditos de pacotes de um cliente
 */
export async function getCustomerPackageCredits(customerId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('customer_package_credits')
      .select(`
        *,
        package:service_packages(
          id,
          name,
          description,
          package_price
        )
      `)
      .eq('customer_id', customerId)
      .gt('remaining_uses', 0)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('purchased_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar créditos:', error)
      return { success: false, error: 'Erro ao buscar créditos' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar créditos:', error)
    return { success: false, error: 'Erro ao buscar créditos' }
  }
}
