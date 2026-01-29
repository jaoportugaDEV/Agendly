// Types for public site functionality

export interface PublicProfileData {
  id?: string
  business_id?: string
  short_description?: string
  full_description?: string
  hero_image_url?: string
  whatsapp?: string
  instagram?: string
  facebook?: string
  website?: string
  show_address: boolean
  custom_cta_text?: string
  google_maps_url?: string
  address?: string
  created_at?: string
  updated_at?: string
}

export interface GalleryImage {
  id: string
  business_id: string
  image_url: string
  caption?: string
  display_order: number
  created_at: string
}

export interface PublicSiteData {
  business: {
    id: string
    name: string
    slug: string
    logo_url?: string
    address?: string
    phone?: string
    email?: string
  }
  profile: PublicProfileData | null
  services: Array<{
    id: string
    name: string
    description?: string
    duration_minutes: number
    price: number
    currency: string
  }>
  gallery: GalleryImage[]
  reviews: any[]
  reviewStats: {
    averageRating: number
    totalReviews: number
    distribution: Record<number, number>
  }
}

export interface UpdatePublicProfileInput {
  short_description?: string
  full_description?: string
  whatsapp?: string
  instagram?: string
  facebook?: string
  website?: string
  show_address?: boolean
  custom_cta_text?: string
  google_maps_url?: string
  address?: string
}

export interface AddGalleryImageInput {
  caption?: string
}
