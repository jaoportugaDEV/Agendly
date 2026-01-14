// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/server'
import { publicProfileSchema } from '@/lib/validations/public-site'
import { revalidatePath } from 'next/cache'
import type { PublicSiteData, UpdatePublicProfileInput } from '@/types/public-site'

/**
 * Get public site data by business slug
 * Used for rendering public landing page
 */
export async function getPublicSiteData(
  slug: string
): Promise<{ success: boolean; data?: PublicSiteData; error?: string }> {
  console.log('🔵 getPublicSiteData called for slug:', slug)
  const supabase = createPublicClient()

  try {
    // 1. Get business basic info
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, slug, logo_url, address, phone, email')
      .eq('slug', slug)
      .eq('active', true)
      .is('deleted_at', null)
      .single()

    if (businessError || !business) {
      console.error('❌ Error fetching business:', businessError)
      return { success: false, error: 'Empresa não encontrada' }
    }

    console.log('✅ Business found:', business.name, business.id)

    // 2. Get public profile (if exists)
    const { data: profile, error: profileError } = await supabase
      .from('business_public_profile')
      .select('*')
      .eq('business_id', business.id)
      .single()

    if (profileError) {
      console.log('⚠️ No profile found (this is ok for new sites):', profileError.code)
    }

    console.log('📋 Profile data:', profile)
    console.log('🖼️ Hero image URL:', profile?.hero_image_url)

    // 3. Get active services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, description, duration_minutes, price, currency')
      .eq('business_id', business.id)
      .eq('active', true)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (servicesError) {
      console.error('❌ Error fetching services:', servicesError)
    }

    console.log('📦 Services count:', services?.length || 0)

    // 4. Get gallery images
    const { data: gallery, error: galleryError } = await supabase
      .from('business_gallery')
      .select('*')
      .eq('business_id', business.id)
      .order('display_order', { ascending: true })

    if (galleryError) {
      console.error('❌ Error fetching gallery:', galleryError)
    }

    console.log('🖼️ Gallery images count:', gallery?.length || 0)

    return {
      success: true,
      data: {
        business,
        profile: profile || null,
        services: services || [],
        gallery: gallery || [],
      },
    }
  } catch (error) {
    console.error('❌ Error in getPublicSiteData:', error)
    return { success: false, error: 'Erro ao carregar dados do site' }
  }
}

/**
 * Get public profile for admin editing
 * Requires authentication
 */
export async function getPublicProfileForEdit(businessId: string) {
  const supabase = await createClient()

  try {
    const { data: profile, error } = await supabase
      .from('business_public_profile')
      .select('*')
      .eq('business_id', businessId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is ok
      console.error('Error fetching profile:', error)
      return { success: false, error: 'Erro ao carregar perfil' }
    }

    return { success: true, data: profile }
  } catch (error) {
    console.error('Error in getPublicProfileForEdit:', error)
    return { success: false, error: 'Erro ao carregar perfil' }
  }
}

/**
 * Update public profile
 * Admin only
 */
export async function updatePublicProfile(
  businessId: string,
  input: UpdatePublicProfileInput
) {
  const supabase = await createClient()

  try {
    // Validate input
    const validation = publicProfileSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Dados inválidos',
      }
    }

    // Check if profile exists
    const { data: existing } = await supabase
      .from('business_public_profile')
      .select('id')
      .eq('business_id', businessId)
      .single()

    let result

    if (existing) {
      // Update existing profile
      result = await supabase
        .from('business_public_profile')
        .update(validation.data)
        .eq('business_id', businessId)
        .select()
        .single()
    } else {
      // Create new profile
      result = await supabase
        .from('business_public_profile')
        .insert({
          business_id: businessId,
          ...validation.data,
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error updating profile:', result.error)
      return { success: false, error: 'Erro ao salvar perfil' }
    }

    // Get business slug for revalidation
    const { data: business } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', businessId)
      .single()

    if (business) {
      revalidatePath(`/site/${business.slug}`)
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error in updatePublicProfile:', error)
    return { success: false, error: 'Erro ao salvar perfil' }
  }
}

/**
 * Get gallery images for admin editing
 */
export async function getGalleryImages(businessId: string) {
  const supabase = await createClient()

  try {
    const { data: images, error } = await supabase
      .from('business_gallery')
      .select('*')
      .eq('business_id', businessId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching gallery:', error)
      return { success: false, error: 'Erro ao carregar galeria' }
    }

    return { success: true, data: images || [] }
  } catch (error) {
    console.error('Error in getGalleryImages:', error)
    return { success: false, error: 'Erro ao carregar galeria' }
  }
}

/**
 * Upload hero image
 * Admin only
 */
export async function uploadHeroImage(businessId: string, formData: FormData) {
  console.log('🔵 uploadHeroImage called for business:', businessId)
  const supabase = await createClient()

  try {
    const file = formData.get('file') as File
    if (!file) {
      console.error('❌ No file provided')
      return { success: false, error: 'Nenhum arquivo fornecido' }
    }

    console.log('📄 File info:', { name: file.name, size: file.size, type: file.type })

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${businessId}/hero/${fileName}`
    console.log('📂 Upload path:', filePath)

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('business-media')
      .upload(filePath, file, {
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ Error uploading file:', uploadError)
      return { success: false, error: 'Erro ao fazer upload da imagem' }
    }

    console.log('✅ File uploaded:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('business-media')
      .getPublicUrl(filePath)

    console.log('🔗 Public URL:', urlData.publicUrl)

    // Update profile with new hero image URL
    const { data: updateData, error: updateError } = await supabase
      .from('business_public_profile')
      .upsert({
        business_id: businessId,
        hero_image_url: urlData.publicUrl,
      }, {
        onConflict: 'business_id'
      })
      .select()

    if (updateError) {
      console.error('❌ Error updating profile with hero image:', updateError)
      return { success: false, error: 'Erro ao atualizar perfil' }
    }

    console.log('✅ Profile updated:', updateData)

    // Get business slug for revalidation
    const { data: business } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', businessId)
      .single()

    if (business) {
      console.log('♻️ Revalidating path:', `/site/${business.slug}`)
      revalidatePath(`/site/${business.slug}`)
    }

    console.log('✅ Upload complete, URL:', urlData.publicUrl)
    return { success: true, data: { url: urlData.publicUrl } }
  } catch (error) {
    console.error('❌ Error in uploadHeroImage:', error)
    return { success: false, error: 'Erro ao fazer upload da imagem' }
  }
}

/**
 * Add image to gallery
 * Admin only
 */
export async function addGalleryImage(
  businessId: string,
  formData: FormData
) {
  const supabase = await createClient()

  try {
    const file = formData.get('file') as File
    const caption = formData.get('caption') as string

    if (!file) {
      return { success: false, error: 'Nenhum arquivo fornecido' }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${businessId}/gallery/${fileName}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('business-media')
      .upload(filePath, file, {
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return { success: false, error: 'Erro ao fazer upload da imagem' }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('business-media')
      .getPublicUrl(filePath)

    // Get max display_order
    const { data: maxOrder } = await supabase
      .from('business_gallery')
      .select('display_order')
      .eq('business_id', businessId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrder?.display_order ?? -1) + 1

    // Add to gallery
    const { data: galleryData, error: galleryError } = await supabase
      .from('business_gallery')
      .insert({
        business_id: businessId,
        image_url: urlData.publicUrl,
        caption: caption || null,
        display_order: nextOrder,
      })
      .select()
      .single()

    if (galleryError) {
      console.error('Error adding to gallery:', galleryError)
      return { success: false, error: 'Erro ao adicionar imagem à galeria' }
    }

    // Get business slug for revalidation
    const { data: business } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', businessId)
      .single()

    if (business) {
      revalidatePath(`/site/${business.slug}`)
    }

    return { success: true, data: galleryData }
  } catch (error) {
    console.error('Error in addGalleryImage:', error)
    return { success: false, error: 'Erro ao adicionar imagem' }
  }
}

/**
 * Remove image from gallery
 * Admin only
 */
export async function removeGalleryImage(imageId: string) {
  const supabase = await createClient()

  try {
    // Get image details before deleting
    const { data: image, error: fetchError } = await supabase
      .from('business_gallery')
      .select('image_url, business_id')
      .eq('id', imageId)
      .single()

    if (fetchError || !image) {
      return { success: false, error: 'Imagem não encontrada' }
    }

    // Extract file path from URL
    const url = new URL(image.image_url)
    const pathParts = url.pathname.split('/business-media/')
    const filePath = pathParts[1]

    // Delete from storage
    if (filePath) {
      await supabase.storage.from('business-media').remove([filePath])
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('business_gallery')
      .delete()
      .eq('id', imageId)

    if (deleteError) {
      console.error('Error deleting from gallery:', deleteError)
      return { success: false, error: 'Erro ao remover imagem' }
    }

    // Get business slug for revalidation
    const { data: business } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', image.business_id)
      .single()

    if (business) {
      revalidatePath(`/site/${business.slug}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error in removeGalleryImage:', error)
    return { success: false, error: 'Erro ao remover imagem' }
  }
}

/**
 * Reorder gallery images
 * Admin only
 */
export async function reorderGallery(businessId: string, imageIds: string[]) {
  const supabase = await createClient()

  try {
    // Update display_order for each image
    const updates = imageIds.map((id, index) =>
      supabase
        .from('business_gallery')
        .update({ display_order: index })
        .eq('id', id)
        .eq('business_id', businessId)
    )

    const results = await Promise.all(updates)

    const hasError = results.some((r) => r.error)
    if (hasError) {
      return { success: false, error: 'Erro ao reordenar imagens' }
    }

    // Get business slug for revalidation
    const { data: business } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', businessId)
      .single()

    if (business) {
      revalidatePath(`/site/${business.slug}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error in reorderGallery:', error)
    return { success: false, error: 'Erro ao reordenar imagens' }
  }
}
