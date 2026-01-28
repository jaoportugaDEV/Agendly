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

    // Buscar bloqueio
    const { data: block } = await supabase
      .from('schedule_blocks')
      .select('business_id, staff_id')
      .eq('id', params.id)
      .single()

    if (!block) {
      return NextResponse.json({ error: 'Bloqueio não encontrado' }, { status: 404 })
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

    // Admin pode deletar qualquer bloqueio, staff só pode deletar seus próprios
    const isAdmin = membership.role === 'admin'
    const isOwnBlock = block.staff_id === user.id

    if (!isAdmin && !isOwnBlock) {
      return NextResponse.json({ error: 'Sem permissão para excluir este bloqueio' }, { status: 403 })
    }

    // Deletar bloqueio
    const { error } = await supabase
      .from('schedule_blocks')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Erro ao excluir bloqueio:', error)
      return NextResponse.json({ error: 'Erro ao excluir bloqueio' }, { status: 500 })
    }

    revalidatePath(`/${block.business_id}/agenda`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
