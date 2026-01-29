import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function PUT(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Verificar se é admin
  const { data: membership } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', params.businessId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const { colors } = await request.json()
    
    if (!colors || !colors.primary || !colors.secondary || !colors.accent) {
      return NextResponse.json({ error: 'Cores inválidas' }, { status: 400 })
    }

    // Atualizar cores no banco (já vêm em formato HSL)
    const { error } = await supabase
      .from('businesses')
      .update({ custom_colors: colors })
      .eq('id', params.businessId)

    if (error) {
      console.error('Erro ao salvar cores:', error)
      return NextResponse.json({ error: 'Erro ao salvar cores' }, { status: 500 })
    }

    // Buscar slug para revalidar
    const { data: business } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', params.businessId)
      .single()

    if (business) {
      revalidatePath(`/site/${business.slug}`)
      revalidatePath(`/${params.businessId}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de cores:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
