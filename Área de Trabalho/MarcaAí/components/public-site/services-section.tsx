import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  currency: string
}

interface ServicesSectionProps {
  services: Service[]
  businessSlug: string
}

export function ServicesSection({ services, businessSlug }: ServicesSectionProps) {
  if (services.length === 0) return null

  const formatCurrency = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  }

  return (
    <section className="py-16">
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Nossos Serviços
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
                {service.description && (
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{formatDuration(service.duration_minutes)}</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {formatCurrency(service.price, service.currency)}
                  </span>
                </div>

                <Link href={`/agendar/${businessSlug}?service=${service.id}`}>
                  <Button variant="outline" className="w-full">
                    Agendar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
