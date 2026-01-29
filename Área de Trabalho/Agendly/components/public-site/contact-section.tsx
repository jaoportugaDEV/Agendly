import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Mail, Instagram, Facebook, Globe } from 'lucide-react'
import Link from 'next/link'
import { GoogleMapsEmbed } from './google-maps-embed'

interface ContactSectionProps {
  address?: string
  phone?: string
  email?: string
  whatsapp?: string
  instagram?: string
  facebook?: string
  website?: string
  showAddress: boolean
  businessSlug: string
  ctaText?: string
  googleMapsUrl?: string
  businessName: string
  profileAddress?: string
}

export function ContactSection({
  address,
  phone,
  email,
  whatsapp,
  instagram,
  facebook,
  website,
  showAddress,
  businessSlug,
  ctaText = 'Agendar agora',
  googleMapsUrl,
  businessName,
  profileAddress,
}: ContactSectionProps) {
  const hasContactInfo = showAddress || phone || email || whatsapp || instagram || facebook || website
  
  // Priorizar endereço do profile, senão usar o da business
  const displayAddress = profileAddress || address

  return (
    <section className="py-16">
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Contato
        </h2>

        {/* Mapa do Google Maps OU Endereço Manual */}
        {(googleMapsUrl || (showAddress && displayAddress)) && (
          <div className="mb-12 max-w-5xl mx-auto space-y-4">
            {/* Mapa (se houver) */}
            {googleMapsUrl && (
              <GoogleMapsEmbed mapsUrl={googleMapsUrl} businessName={businessName} />
            )}
            
            {/* Endereço destacado */}
            {showAddress && displayAddress && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Endereço</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed whitespace-pre-line mb-3">
                      {displayAddress}
                    </p>
                    {/* Botão para abrir no Google Maps */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                    >
                      <MapPin className="h-4 w-4" />
                      Ver no Google Maps
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {hasContactInfo && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Informações</h3>
              <div className="space-y-4">
                {showAddress && address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <span>{address}</span>
                  </div>
                )}

                {phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <a href={`tel:${phone}`} className="hover:underline">
                      {phone}
                    </a>
                  </div>
                )}

                {whatsapp && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <a 
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      WhatsApp: {whatsapp}
                    </a>
                  </div>
                )}

                {email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <a href={`mailto:${email}`} className="hover:underline">
                      {email}
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Redes Sociais</h3>
            <div className="space-y-3">
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                  <span>Instagram</span>
                </a>
              )}

              {facebook && (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                  <span>Facebook</span>
                </a>
              )}

              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Globe className="h-5 w-5" />
                  <span>Website</span>
                </a>
              )}

              {!instagram && !facebook && !website && (
                <p className="text-muted-foreground">
                  Nenhuma rede social cadastrada
                </p>
              )}
            </div>

            <div className="mt-6">
              <Link href={`/agendar/${businessSlug}`}>
                <Button className="w-full">
                  {ctaText}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
