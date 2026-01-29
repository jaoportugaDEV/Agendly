import { z } from 'zod'

export const publicProfileSchema = z.object({
  short_description: z.string().max(200, 'Descrição curta deve ter no máximo 200 caracteres').optional().or(z.literal('')),
  full_description: z.string().max(2000, 'Descrição completa deve ter no máximo 2000 caracteres').optional().or(z.literal('')),
  whatsapp: z.string().regex(/^\d+$/, 'WhatsApp deve conter apenas números').max(20, 'WhatsApp muito longo').optional().or(z.literal('')),
  instagram: z.string().url('URL do Instagram inválida').optional().or(z.literal('')),
  facebook: z.string().url('URL do Facebook inválida').optional().or(z.literal('')),
  website: z.string().url('URL do site inválida').optional().or(z.literal('')),
  show_address: z.boolean(),
  custom_cta_text: z.string().max(50, 'Texto do botão deve ter no máximo 50 caracteres').optional().or(z.literal('')),
  google_maps_url: z.string().url('URL do Google Maps inválida').optional().or(z.literal('')),
  address: z.string().max(300, 'Endereço deve ter no máximo 300 caracteres').optional().or(z.literal('')),
})

export type PublicProfileInput = z.infer<typeof publicProfileSchema>

export const galleryImageSchema = z.object({
  caption: z.string().max(200, 'Legenda deve ter no máximo 200 caracteres').optional().or(z.literal('')),
})

export type GalleryImageInput = z.infer<typeof galleryImageSchema>

// Validation for image files
export const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo inválido. Use JPEG, PNG ou WebP.',
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Arquivo muito grande. Máximo 2MB.',
    }
  }

  return { valid: true }
}
