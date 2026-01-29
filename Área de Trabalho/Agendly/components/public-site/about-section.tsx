import { Card } from '@/components/ui/card'

interface AboutSectionProps {
  fullDescription?: string
}

export function AboutSection({ fullDescription }: AboutSectionProps) {
  if (!fullDescription) return null

  return (
    <section className="py-16 bg-muted/30">
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Sobre Nós
        </h2>

        <Card className="max-w-4xl mx-auto p-8">
          <p className="text-lg leading-relaxed whitespace-pre-wrap">
            {fullDescription}
          </p>
        </Card>
      </div>
    </section>
  )
}
