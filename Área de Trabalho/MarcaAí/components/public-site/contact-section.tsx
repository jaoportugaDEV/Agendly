import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Mail, Instagram, Facebook, Globe } from 'lucide-react'
import Link from 'next/link'

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
}: ContactSectionProps) {
  const hasContactInfo = showAddress || phone || email || whatsapp || instagram || facebook || website

  return (
    <section className="py-16">
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Contato
        </h2>

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
