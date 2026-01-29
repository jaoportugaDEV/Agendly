import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { notes } = await request.json()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar agendamento
    const { data: appointment } = await supabase
      .from('appointments')
      .select('business_id')
      .eq('id', params.id)
      .single()

    if (!appointment) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    }

    // Verificar permissão
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', appointment.business_id)
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Atualizar observações
    const { error } = await supabase
      .from('appointments')
      .update({ notes })
      .eq('id', params.id)

    if (error) {
      console.error('Erro ao atualizar observações:', error)
      return NextResponse.json({ error: 'Erro ao atualizar observações' }, { status: 500 })
    }

    revalidatePath(`/${appointment.business_id}/agenda`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
