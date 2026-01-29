// @ts-nocheck
'use server'

import { createClient, createPublicClient } from '@/lib/supabase/server'
import { getAuthenticatedClient } from '@/lib/utils/jwt'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'

/**
 * Cria uma avaliação para um agendamento
 */
export async function createReview(data: {
  appointmentId: string
  rating: number
  comment?: string
}) {
  try {
    const auth = await getAuthenticatedClient()
    
    const supabase = createPublicClient()

    // Buscar agendamento
    const { data: appointment } = await supabase
      .from('appointments')
      .select('customer_id, business_id, staff_id, status')
      .eq('id', data.appointmentId)
      .single()

    if (!appointment) {
      return { success: false, error: 'Agendamento não encontrado' }
    }

    // Verificar se cliente é dono do agendamento
    if (auth && appointment.customer_id !== auth.customerId) {
      return { success: false, error: 'Você não pode avaliar este agendamento' }
    }

    // Verificar se já existe avaliação
    const { data: existingReview } = await supabase
      .from('appointment_reviews')
      .select('id')
      .eq('appointment_id', data.appointmentId)
      .single()

    if (existingReview) {
      return { success: false, error: 'Este agendamento já foi avaliado' }
    }

    // Criar avaliação
    const { error } = await supabase
      .from('appointment_reviews')
      .insert({
        appointment_id: data.appointmentId,
        customer_id: appointment.customer_id,
        business_id: appointment.business_id,
        staff_id: appointment.staff_id,
        rating: data.rating,
        comment: data.comment,
        is_public: true
      })

    if (error) {
      console.error('Erro ao criar avaliação:', error)
      return { success: false, error: 'Erro ao criar avaliação' }
    }

    revalidatePath(`/site`)
    return { success: true, message: 'Avaliação enviada com sucesso!' }
  } catch (error) {
    console.error('Erro ao criar avaliação:', error)
    return { success: false, error: 'Erro ao criar avaliação' }
  }
}

/**
 * Busca avaliações públicas de um negócio
 */
export async function getBusinessReviews(
  businessId: string,
  filters?: {
    limit?: number
    offset?: number
    rating?: number
  }
) {
  try {
    const supabase = createPublicClient()

    let query = supabase
      .from('appointment_reviews')
      .select(`
        *,
        customer:customers(name, avatar_url),
        staff:users(full_name)
      `)
      .eq('business_id', businessId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (filters?.rating) {
      query = query.eq('rating', filters.rating)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar avaliações:', error)
      return { success: false, error: 'Erro ao buscar avaliações' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error)
    return { success: false, error: 'Erro ao buscar avaliações' }
  }
}

/**
 * Busca estatísticas de avaliações
 */
export async function getReviewStats(businessId: string) {
  try {
    const supabase = createPublicClient()

    const { data: reviews } = await supabase
      .from('appointment_reviews')
      .select('rating')
      .eq('business_id', businessId)
      .eq('is_public', true)

    if (!reviews || reviews.length === 0) {
      return {
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
      }
    }

    const totalReviews = reviews.length
    const sumRatings = reviews.reduce((sum, r) => sum + r.rating, 0)
    const averageRating = Number((sumRatings / totalReviews).toFixed(1))

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(r => {
      distribution[r.rating as keyof typeof distribution]++
    })

    return {
      success: true,
      data: {
        averageRating,
        totalReviews,
        distribution
      }
    }
  } catch (error) {
    console.error('Erro ao buscar stats:', error)
    return { success: false, error: 'Erro ao buscar estatísticas' }
  }
}

/**
 * Responde a uma avaliação (Admin)
 */
export async function respondToReview(reviewId: string, response: string) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Buscar avaliação
    const { data: review } = await supabase
      .from('appointment_reviews')
      .select('business_id')
      .eq('id', reviewId)
      .single()

    if (!review) {
      return { success: false, error: 'Avaliação não encontrada' }
    }

    // Verificar se usuário é admin do negócio
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', review.business_id)
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { success: false, error: 'Sem permissão' }
    }

    // Atualizar resposta
    const { error } = await supabase
      .from('appointment_reviews')
      .update({
        business_response: response,
        responded_at: new Date().toISOString(),
        responded_by: user.id
      })
      .eq('id', reviewId)

    if (error) {
      return { success: false, error: 'Erro ao responder avaliação' }
    }

    revalidatePath('/dashboard')
    return { success: true, message: 'Resposta enviada com sucesso' }
  } catch (error) {
    console.error('Erro ao responder avaliação:', error)
    return { success: false, error: 'Erro ao responder avaliação' }
  }
}

/**
 * Verifica se cliente pode avaliar agendamento
 */
export async function canCustomerReview(appointmentId: string, customerId: string) {
  try {
    const supabase = createPublicClient()

    const { data: appointment } = await supabase
      .from('appointments')
      .select('customer_id, status, start_time')
      .eq('id', appointmentId)
      .single()

    if (!appointment || appointment.customer_id !== customerId) {
      return { success: true, canReview: false, reason: 'Agendamento não encontrado' }
    }

    if (appointment.status !== 'completed') {
      return { success: true, canReview: false, reason: 'Agendamento ainda não foi concluído' }
    }

    // Verificar se já tem avaliação
    const { data: review } = await supabase
      .from('appointment_reviews')
      .select('id')
      .eq('appointment_id', appointmentId)
      .single()

    if (review) {
      return { success: true, canReview: false, reason: 'Já avaliado' }
    }

    return { success: true, canReview: true }
  } catch (error) {
    return { success: false, canReview: false }
  }
}

export async function toggleReviewVisibility(reviewId: string) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Buscar avaliação
    const { data: review } = await supabase
      .from('appointment_reviews')
      .select('business_id, is_public')
      .eq('id', reviewId)
      .single()

    if (!review) {
      return { success: false, error: 'Avaliação não encontrada' }
    }

    // Verificar se usuário é admin do negócio
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', review.business_id)
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { success: false, error: 'Sem permissão' }
    }

    // Toggle visibilidade
    const { error } = await supabase
      .from('appointment_reviews')
      .update({ is_public: !review.is_public })
      .eq('id', reviewId)

    if (error) {
      return { success: false, error: 'Erro ao atualizar visibilidade' }
    }

    // Buscar slug do negócio para revalidar site público
    const { data: business } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', review.business_id)
      .single()

    if (business) {
      revalidatePath(`/site/${business.slug}`)
    }

    revalidatePath(`/${review.business_id}/avaliacoes`)
    
    return { 
      success: true, 
      message: review.is_public ? 'Avaliação ocultada do site público' : 'Avaliação publicada no site'
    }
  } catch (error) {
    console.error('Erro ao alterar visibilidade:', error)
    return { success: false, error: 'Erro ao alterar visibilidade' }
  }
}
