import { getPublicSiteData } from '@/lib/actions/public-site'
import { HeroSection } from '@/components/public-site/hero-section'
import { AboutSection } from '@/components/public-site/about-section'
import { ServicesSection } from '@/components/public-site/services-section'
import { GallerySection } from '@/components/public-site/gallery-section'
import { ContactSection } from '@/components/public-site/contact-section'
import { FloatingCTA } from '@/components/public-site/floating-cta'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface PageProps {
  params: { businessSlug: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { businessSlug } = params
  const result = await getPublicSiteData(businessSlug)

  if (!result.success || !result.data) {
    return {
      title: 'Empresa não encontrada',
    }
  }

  const { business, profile } = result.data

  return {
    title: business.name,
    description: profile?.short_description || profile?.full_description || `Agende serviços em ${business.name}`,
    openGraph: {
      title: business.name,
      description: profile?.short_description || profile?.full_description || `Agende serviços em ${business.name}`,
      images: profile?.hero_image_url ? [profile.hero_image_url] : [],
    },
  }
}

export default async function PublicSitePage({ params }: PageProps) {
  const { businessSlug } = params
  const result = await getPublicSiteData(businessSlug)

  if (!result.success || !result.data) {
    notFound()
  }

  const { business, profile, services, gallery } = result.data

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection
        businessName={business.name}
        shortDescription={profile?.short_description}
        heroImageUrl={profile?.hero_image_url}
        businessSlug={business.slug}
        ctaText={profile?.custom_cta_text}
      />

      {/* About Section */}
      {profile?.full_description && (
        <AboutSection fullDescription={profile.full_description} />
      )}

      {/* Services Section */}
      {services.length > 0 && (
        <ServicesSection services={services} businessSlug={business.slug} />
      )}

      {/* Gallery Section */}
      {gallery.length > 0 && <GallerySection images={gallery} />}

      {/* Contact Section */}
      <ContactSection
        address={business.address}
        phone={business.phone}
        email={business.email}
        whatsapp={profile?.whatsapp}
        instagram={profile?.instagram}
        facebook={profile?.facebook}
        website={profile?.website}
        showAddress={profile?.show_address ?? false}
        businessSlug={business.slug}
        ctaText={profile?.custom_cta_text}
      />

      {/* Floating CTA (Mobile only) */}
      <FloatingCTA
        businessSlug={business.slug}
        ctaText={profile?.custom_cta_text}
      />
    </div>
  )
}
