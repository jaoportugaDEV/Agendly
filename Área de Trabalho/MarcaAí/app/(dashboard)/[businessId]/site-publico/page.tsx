import { getPublicProfileForEdit, getGalleryImages } from '@/lib/actions/public-site'
import { PublicSiteEditor } from '@/components/admin/public-site-editor'
import { HeroImageUploader } from '@/components/admin/hero-image-uploader'
import { GalleryManager } from '@/components/admin/gallery-manager'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: { businessId: string }
}

export default async function SitePublicoPage({ params }: PageProps) {
  const { businessId } = params

  // Get business slug for preview link
  const supabase = await createClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('slug, name')
    .eq('id', businessId)
    .single()

  // Get profile data
  const profileResult = await getPublicProfileForEdit(businessId)
  const galleryResult = await getGalleryImages(businessId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Público</h1>
          <p className="text-muted-foreground mt-1">
            Configure a página pública da sua empresa
          </p>
        </div>

        {business && (
          <Link href={`/site/${business.slug}`} target="_blank">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Site Público
            </Button>
          </Link>
        )}
      </div>

      {/* Preview URL */}
      {business && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">URL do seu site:</span>
            <code className="text-sm bg-background px-2 py-1 rounded">
              /site/{business.slug}
            </code>
            <span className="text-sm text-muted-foreground">
              (Os clientes podem acessar esta página para conhecer e agendar)
            </span>
          </div>
        </Card>
      )}

      {/* Informações e Contato */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Informações e Contato</h2>
        <PublicSiteEditor
          businessId={businessId}
          initialData={profileResult.success ? profileResult.data : null}
        />
      </div>

      {/* Hero Image */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Imagem Principal</h2>
        <HeroImageUploader
          businessId={businessId}
          currentImageUrl={profileResult.data?.hero_image_url}
        />
      </div>

      {/* Gallery */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Galeria de Fotos</h2>
        <GalleryManager
          businessId={businessId}
          initialImages={galleryResult.success ? galleryResult.data : []}
        />
      </div>
    </div>
  )
}
