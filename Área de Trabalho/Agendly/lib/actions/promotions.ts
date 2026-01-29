// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { createPromotionSchema, updatePromotionSchema } from '@/lib/validations/promotion'
import { revalidatePath } from 'next/cache'

/**
 * Busca todas as promoções de um negócio
 */
export async function getPromotions(businessId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('promotions')
    .select(`
      *,
      service:target_id(name),
      package:target_id(name)
    `)
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar promoções:', error)
    return { success: false, error: 'Erro ao buscar promoções' }
  }

  return { success: true, data }
}

/**
 * Busca apenas promoções ativas de um negócio
 */
export async function getActivePromotions(businessId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('business_id', businessId)
    .eq('active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar promoções ativas:', error)
    return { success: false, error: 'Erro ao buscar promoções ativas' }
  }

  return { success: true, data }
}

/**
 * Busca promoção por serviço/pacote específico
 */
export async function getPromotionByTarget(targetId: string, type: 'service' | 'package') {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('target_id', targetId)
    .eq('promotion_type', type)
    .eq('active', true)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhuma promoção encontrada
      return { success: true, data: null }
    }
    console.error('Erro ao buscar promoção:', error)
    return { success: false, error: 'Erro ao buscar promoção' }
  }

  return { success: true, data }
}

/**
 * Busca promoção por ID
 */
export async function getPromotionById(promotionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('id', promotionId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Erro ao buscar promoção:', error)
    return { success: false, error: 'Erro ao buscar promoção' }
  }

  return { success: true, data }
}

/**
 * Cria uma nova promoção
 */
export async function createPromotion(businessId: string, input: unknown) {
  console.log('🔵 createPromotion called with:', { businessId, input })
  const supabase = await createClient()

  // Validar input
  const validation = createPromotionSchema.safeParse(input)
  if (!validation.success) {
    console.error('❌ Validation failed:', validation.error)
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  console.log('✅ Validation passed:', validation.data)
  const {
    name,
    description,
    promotionType,
    targetId,
    promotionalPrice,
    originalPrice,
    weekdays,
    recurrenceType,
    startDate,
    endDate,
    active,
  } = validation.data

  // Calcular desconto percentual
  const discountPercentage = ((originalPrice - promotionalPrice) / originalPrice) * 100

  // Criar promoção
  const insertData = {
    business_id: businessId,
    name,
    description,
    promotion_type: promotionType,
    target_id: targetId,
    promotional_price: promotionalPrice,
    original_price: originalPrice,
    discount_percentage: discountPercentage,
    weekdays,
    recurrence_type: recurrenceType,
    start_date: recurrenceType === 'date_range' ? startDate : null,
    end_date: recurrenceType === 'date_range' ? endDate : null,
    active,
  }
  console.log('📝 Inserting promotion:', insertData)

  const { data, error } = await supabase
    .from('promotions')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('❌ Erro ao criar promoção:', error)
    return { success: false, error: 'Erro ao criar promoção' }
  }

  console.log('✅ Promotion created successfully:', data)
  revalidatePath('/[businessId]/pacotes')
  revalidatePath('/agendar')
  return { success: true, data }
}

/**
 * Atualiza uma promoção existente
 */
export async function updatePromotion(promotionId: string, input: unknown) {
  const supabase = await createClient()

  // Validar input
  const validation = updatePromotionSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos',
    }
  }

  const updateData: Record<string, unknown> = {}

  if (validation.data.name !== undefined) {
    updateData.name = validation.data.name
  }
  if (validation.data.description !== undefined) {
    updateData.description = validation.data.description
  }
  if (validation.data.promotionalPrice !== undefined) {
    updateData.promotional_price = validation.data.promotionalPrice
  }
  if (validation.data.originalPrice !== undefined) {
    updateData.original_price = validation.data.originalPrice
  }
  if (validation.data.weekdays !== undefined) {
    updateData.weekdays = validation.data.weekdays
  }
  if (validation.data.recurrenceType !== undefined) {
    updateData.recurrence_type = validation.data.recurrenceType
  }
  if (validation.data.startDate !== undefined) {
    updateData.start_date = validation.data.startDate
  }
  if (validation.data.endDate !== undefined) {
    updateData.end_date = validation.data.endDate
  }
  if (validation.data.active !== undefined) {
    updateData.active = validation.data.active
  }

  // Recalcular desconto se preços foram alterados
  if (validation.data.promotionalPrice !== undefined || validation.data.originalPrice !== undefined) {
    // Buscar valores atuais se necessário
    const { data: currentPromo } = await supabase
      .from('promotions')
      .select('promotional_price, original_price')
      .eq('id', promotionId)
      .single()

    if (currentPromo) {
      const finalPromotionalPrice = validation.data.promotionalPrice ?? currentPromo.promotional_price
      const finalOriginalPrice = validation.data.originalPrice ?? currentPromo.original_price
      updateData.discount_percentage = ((finalOriginalPrice - finalPromotionalPrice) / finalOriginalPrice) * 100
    }
  }

  // Atualizar promoção
  const { data, error } = await supabase
    .from('promotions')
    .update(updateData)
    .eq('id', promotionId)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar promoção:', error)
    return { success: false, error: 'Erro ao atualizar promoção' }
  }

  revalidatePath('/[businessId]/pacotes')
  revalidatePath('/agendar')
  return { success: true, data }
}

/**
 * Ativa ou desativa uma promoção
 */
export async function togglePromotionStatus(promotionId: string, active: boolean) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('promotions')
    .update({ active })
    .eq('id', promotionId)
    .select()
    .single()

  if (error) {
    console.error('Erro ao alterar status da promoção:', error)
    return { success: false, error: 'Erro ao alterar status da promoção' }
  }

  revalidatePath('/[businessId]/pacotes')
  revalidatePath('/agendar')
  return { success: true, data }
}

/**
 * Deleta uma promoção (soft delete)
 */
export async function deletePromotion(promotionId: string) {
  const supabase = await createClient()

  // Soft delete
  const { error } = await supabase
    .from('promotions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', promotionId)

  if (error) {
    console.error('Erro ao deletar promoção:', error)
    return { success: false, error: 'Erro ao deletar promoção' }
  }

  revalidatePath('/[businessId]/pacotes')
  revalidatePath('/agendar')
  return { success: true }
}

