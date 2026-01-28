import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar bloqueio para pegar info de recorrência
    const { data: block } = await supabase
      .from('schedule_blocks')
      .select('business_id, reason, recurrence_pattern, staff_id, start_time, is_recurring, applies_to_all, color')
      .eq('id', params.id)
      .single()

    if (!block) {
      return NextResponse.json({ error: 'Bloqueio não encontrado' }, { status: 404 })
    }

    if (!block.is_recurring) {
      return NextResponse.json({ error: 'Este bloqueio não é recorrente' }, { status: 400 })
    }

    // Verificar permissão
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', block.business_id)
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Admin pode deletar qualquer série, staff só pode deletar suas próprias
    const isAdmin = membership.role === 'admin'
    const isOwnBlock = block.staff_id === user.id

    if (!isAdmin && !isOwnBlock) {
      return NextResponse.json({ error: 'Sem permissão para excluir este bloqueio' }, { status: 403 })
    }

    // Construir query para deletar série completa
    // Buscar por: mesmo business, mesmo staff (ou applies_to_all), mesmo motivo, mesmo padrão, mesma cor
    let deleteQuery = supabase
      .from('schedule_blocks')
      .delete()
      .eq('business_id', block.business_id)
      .eq('reason', block.reason)
      .eq('recurrence_pattern', block.recurrence_pattern)
      .eq('color', block.color)
      .eq('is_recurring', true)

    // Filtrar por staff ou applies_to_all
    if (block.applies_to_all) {
      deleteQuery = deleteQuery.eq('applies_to_all', true)
    } else if (block.staff_id) {
      deleteQuery = deleteQuery.eq('staff_id', block.staff_id)
    }

    const { error } = await deleteQuery

    if (error) {
      console.error('Erro ao excluir série:', error)
      return NextResponse.json({ error: 'Erro ao excluir série' }, { status: 500 })
    }

    revalidatePath(`/${block.business_id}/agenda`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
