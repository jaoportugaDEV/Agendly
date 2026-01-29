import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface HeroSectionProps {
  businessName: string
  shortDescription?: string
  heroImageUrl?: string
  businessSlug: string
  ctaText?: string
}

export function HeroSection({
  businessName,
  shortDescription,
  heroImageUrl,
  businessSlug,
  ctaText = 'Agendar agora',
}: HeroSectionProps) {
  const backgroundStyle = heroImageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)',
      }

  return (
    <section 
      className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center text-white"
      style={backgroundStyle}
    >
      <div className="container px-4 text-center z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          {businessName}
        </h1>
        
        {shortDescription && (
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            {shortDescription}
          </p>
        )}

        <Link href={`/agendar/${businessSlug}`}>
          <Button size="lg" className="text-lg px-8 py-6">
            {ctaText}
          </Button>
        </Link>
      </div>
    </section>
  )
}
