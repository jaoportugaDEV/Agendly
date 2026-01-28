import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(
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
    // Upload do arquivo
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Arquivo deve ser uma imagem' }, { status: 400 })
    }

    // Upload para storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${params.businessId}/logo/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('business-media')
      .upload(filePath, file, {
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError)
      return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('business-media')
      .getPublicUrl(filePath)

    // Atualizar logo_url no banco
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ logo_url: publicUrl })
      .eq('id', params.businessId)

    if (updateError) {
      console.error('Erro ao atualizar logo:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar logo' }, { status: 500 })
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

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error('Erro na API de logo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
