'use server'

import { createClient } from '@/lib/supabase/server'
import { createPaymentSchema, confirmInstallmentSchema, paymentFiltersSchema } from '@/lib/validations/payment'
import { revalidatePath } from 'next/cache'
import { PaymentData, InstallmentData } from '@/types/shared'

/**
 * Cria um pagamento para um agendamento (à vista ou parcelado)
 */
export async function createPayment(input: unknown) {
  try {
    // Validar input
    const validation = createPaymentSchema.safeParse(input)
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.errors[0]?.message || 'Dados inválidos' 
      }
    }

    const data = validation.data
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Buscar agendamento
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('id, business_id, customer_id, price, currency, status')
      .eq('id', data.appointmentId)
      .single()

    if (aptError || !appointment) {
      return { success: false, error: 'Agendamento não encontrado' }
    }

    // Verificar se é admin
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', appointment.business_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { success: false, error: 'Apenas administradores podem gerenciar pagamentos' }
    }

    // Verificar se já existe pagamento para este agendamento
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('appointment_id', data.appointmentId)
      .single()

    if (existingPayment) {
      return { success: false, error: 'Já existe um pagamento para este agendamento' }
    }

    // Criar pagamento
    const isInstallment = data.paymentType === 'installment'
    const installmentCount = isInstallment ? data.installmentCount! : null

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        business_id: appointment.business_id,
        appointment_id: appointment.id,
        customer_id: appointment.customer_id,
        total_amount: appointment.price,
        paid_amount: isInstallment ? 0 : appointment.price,
        currency: appointment.currency,
        payment_status: isInstallment ? 'installment' : 'paid',
        payment_method: data.paymentMethod,
        is_installment: isInstallment,
        installment_count: installmentCount,
        paid_at: isInstallment ? null : new Date().toISOString(),
        notes: data.notes
      })
      .select()
      .single()

    if (paymentError || !payment) {
      console.error('Erro ao criar pagamento:', paymentError)
      return { success: false, error: 'Erro ao criar pagamento' }
    }

    // Se for parcelado, criar as parcelas
    if (isInstallment && installmentCount) {
      const installments = []
      const baseAmount = appointment.price / installmentCount
      
      for (let i = 1; i <= installmentCount; i++) {
        // Ajustar última parcela para compensar arredondamento
        const amount = i === installmentCount
          ? appointment.price - (baseAmount * (installmentCount - 1))
          : baseAmount

        // Calcular data de vencimento (30 dias * número da parcela)
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + (30 * i))

        installments.push({
          payment_id: payment.id,
          business_id: appointment.business_id,
          appointment_id: appointment.id,
          customer_id: appointment.customer_id,
          installment_number: i,
          installment_amount: Math.round(amount * 100) / 100, // Arredondar para 2 casas decimais
          due_date: dueDate.toISOString().split('T')[0]
        })
      }

      const { error: installmentsError } = await supabase
        .from('payment_installments')
        .insert(installments)

      if (installmentsError) {
        console.error('Erro ao criar parcelas:', installmentsError)
        // Reverter criação do payment
        await supabase.from('payments').delete().eq('id', payment.id)
        return { success: false, error: 'Erro ao criar parcelas' }
      }
    }

    // Atualizar status do agendamento para completed
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', appointment.id)

    if (updateError) {
      console.error('Erro ao atualizar status:', updateError)
      return { success: false, error: 'Erro ao atualizar status do agendamento' }
    }

    revalidatePath('/', 'layout')
    
    return { 
      success: true, 
      data: payment,
      message: isInstallment 
        ? `Pagamento parcelado em ${installmentCount}x criado com sucesso`
        : 'Pagamento registrado com sucesso'
    }
  } catch (error) {
    console.error('Erro ao criar pagamento:', error)
    return { success: false, error: 'Erro inesperado ao criar pagamento' }
  }
}

/**
 * Confirma o pagamento de uma parcela
 */
export async function confirmInstallment(input: unknown) {
  try {
    // Validar input
    const validation = confirmInstallmentSchema.safeParse(input)
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.errors[0]?.message || 'Dados inválidos' 
      }
    }

    const data = validation.data
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Buscar parcela
    const { data: installment, error: instError } = await supabase
      .from('payment_installments')
      .select('*, payment:payments(business_id)')
      .eq('id', data.installmentId)
      .single()

    if (instError || !installment) {
      return { success: false, error: 'Parcela não encontrada' }
    }

    // Verificar se é admin
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', (installment.payment as any).business_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return { success: false, error: 'Apenas administradores podem confirmar pagamentos' }
    }

    // Verificar se já está paga
    if (installment.status === 'paid') {
      return { success: false, error: 'Esta parcela já foi paga' }
    }

    // Atualizar status da parcela
    const { error: updateError } = await supabase
      .from('payment_installments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        notes: data.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.installmentId)

    if (updateError) {
      console.error('Erro ao atualizar parcela:', updateError)
      return { success: false, error: 'Erro ao confirmar pagamento da parcela' }
    }

    // O trigger update_payment_amount() atualiza automaticamente o payment

    revalidatePath('/', 'layout')
    
    return { 
      success: true, 
      message: `Parcela ${installment.installment_number} confirmada com sucesso`
    }
  } catch (error) {
    console.error('Erro ao confirmar parcela:', error)
    return { success: false, error: 'Erro inesperado ao confirmar parcela' }
  }
}

/**
 * Busca parcelas pendentes a receber
 */
export async function getInstallmentsToReceive(businessId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payment_installments')
      .select(`
        *,
        payment:payments(
          total_amount,
          payment_method
        ),
        appointment:appointments(
          start_time,
          service:services(name),
          customer:customers(name, phone, avatar_url)
        )
      `)
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Erro ao buscar parcelas:', error)
      return { success: false, error: 'Erro ao buscar parcelas' }
    }

    // Adicionar flag isOverdue
    const installmentsWithOverdue = (data || []).map(inst => ({
      ...inst,
      isOverdue: new Date(inst.due_date) < new Date()
    }))

    return { success: true, data: installmentsWithOverdue }
  } catch (error) {
    console.error('Erro ao buscar parcelas:', error)
    return { success: false, error: 'Erro ao buscar parcelas' }
  }
}

/**
 * Busca todos os pagamentos de um período
 */
export async function getPaymentsReport(businessId: string, filters?: unknown) {
  try {
    const validation = paymentFiltersSchema.safeParse(filters || {})
    const filterData = validation.success ? validation.data : {}

    const supabase = await createClient()

    let query = supabase
      .from('payments')
      .select(`
        *,
        appointment:appointments(
          start_time,
          service:services(name),
          customer:customers(name),
          staff:users(full_name)
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filterData.startDate) {
      query = query.gte('created_at', filterData.startDate)
    }
    if (filterData.endDate) {
      query = query.lte('created_at', filterData.endDate)
    }
    if (filterData.status && filterData.status !== 'all') {
      if (filterData.status === 'overdue') {
        // Buscar payments com parcelas vencidas
        query = query.eq('payment_status', 'installment')
      } else {
        query = query.eq('payment_status', filterData.status)
      }
    }
    if (filterData.paymentMethod) {
      query = query.eq('payment_method', filterData.paymentMethod)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar pagamentos:', error)
      return { success: false, error: 'Erro ao buscar pagamentos' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error)
    return { success: false, error: 'Erro ao buscar pagamentos' }
  }
}

/**
 * Busca estatísticas financeiras
 */
export async function getFinancialStats(businessId: string, startDate: string, endDate: string) {
  try {
    const supabase = await createClient()

    // Buscar pagamentos do período
    const { data: payments } = await supabase
      .from('payments')
      .select('total_amount, paid_amount, payment_status, currency')
      .eq('business_id', businessId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Buscar parcelas vencidas
    const { data: overdueInstallments } = await supabase
      .from('payment_installments')
      .select('installment_amount')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString().split('T')[0])

    // Calcular totais
    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.paid_amount), 0) || 0
    const pendingRevenue = payments
      ?.filter(p => p.payment_status === 'installment')
      .reduce((sum, p) => sum + (Number(p.total_amount) - Number(p.paid_amount)), 0) || 0
    
    const overdueAmount = overdueInstallments?.reduce((sum, i) => sum + Number(i.installment_amount), 0) || 0
    const overdueCount = overdueInstallments?.length || 0

    return {
      success: true,
      data: {
        totalRevenue,
        pendingRevenue,
        overdueAmount,
        overdueCount,
        currency: payments?.[0]?.currency || 'BRL'
      }
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return { success: false, error: 'Erro ao buscar estatísticas financeiras' }
  }
}

/**
 * Busca detalhes de um pagamento específico
 */
export async function getPaymentDetails(paymentId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        installments:payment_installments(
          id,
          installment_number,
          installment_amount,
          status,
          due_date,
          paid_at
        ),
        appointment:appointments(
          start_time,
          service:services(name),
          customer:customers(name, phone),
          staff:users(full_name)
        )
      `)
      .eq('id', paymentId)
      .single()

    if (error) {
      console.error('Erro ao buscar pagamento:', error)
      return { success: false, error: 'Erro ao buscar detalhes do pagamento' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error)
    return { success: false, error: 'Erro ao buscar detalhes do pagamento' }
  }
}

/**
 * Verifica se um agendamento tem parcelas vencidas
 */
export async function hasOverdueInstallments(appointmentId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from('payment_installments')
      .select('id')
      .eq('appointment_id', appointmentId)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .limit(1)

    return (data?.length || 0) > 0
  } catch (error) {
    console.error('Erro ao verificar parcelas vencidas:', error)
    return false
  }
}

/**
 * Busca performance de cada staff member (receita por funcionário)
 */
export async function getStaffPerformance(businessId: string, startDate: string, endDate: string) {
  try {
    const supabase = await createClient()

    // Buscar todos os pagamentos com informações do staff
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        paid_amount,
        appointment:appointments(
          staff_id,
          staff:users(id, full_name, avatar_url)
        )
      `)
      .eq('business_id', businessId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('payment_status', ['paid', 'installment'])

    if (error) {
      console.error('Erro ao buscar performance de staff:', error)
      return { success: false, error: 'Erro ao buscar performance' }
    }

    // Agrupar por staff
    const staffMap = new Map<string, {
      staffId: string
      staffName: string
      avatarUrl?: string
      totalRevenue: number
      appointmentCount: number
    }>()

    payments?.forEach(payment => {
      const appointment = payment.appointment as any
      if (!appointment?.staff_id) return

      const staffId = appointment.staff_id
      const staffName = appointment.staff?.full_name || 'Staff'
      const avatarUrl = appointment.staff?.avatar_url

      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, {
          staffId,
          staffName,
          avatarUrl,
          totalRevenue: 0,
          appointmentCount: 0
        })
      }

      const staff = staffMap.get(staffId)!
      staff.totalRevenue += Number(payment.paid_amount)
      staff.appointmentCount += 1
    })

    // Converter para array e ordenar por receita
    const staffPerformance = Array.from(staffMap.values())
      .map(staff => ({
        ...staff,
        averageTicket: staff.appointmentCount > 0 
          ? staff.totalRevenue / staff.appointmentCount 
          : 0
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    return {
      success: true,
      data: staffPerformance
    }
  } catch (error) {
    console.error('Erro ao buscar performance:', error)
    return { success: false, error: 'Erro ao buscar performance' }
  }
}
