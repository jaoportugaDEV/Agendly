'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getAvatarInitials } from '@/lib/validations/avatar'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  business_response: string | null
  customer: {
    name: string
    avatar_url?: string | null
  }
  staff: {
    full_name: string
  } | null
}

interface ReviewsSectionProps {
  reviews: Review[]
  stats: {
    averageRating: number
    totalReviews: number
    distribution: { [key: number]: number }
  }
}

export function ReviewsSection({ reviews, stats }: ReviewsSectionProps) {
  if (stats.totalReviews === 0) return null

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
    
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header com Stats */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Avaliações dos Clientes
            </h2>
            <div className="flex flex-col items-center gap-4">
              <div>
                <div className="text-5xl font-bold mb-2">
                  {stats.averageRating.toFixed(1)}
                </div>
                {renderStars(Math.round(stats.averageRating), 'lg')}
                <p className="text-sm text-muted-foreground mt-2">
                  Baseado em {stats.totalReviews} avaliações
                </p>
              </div>

              {/* Distribuição */}
              <div className="w-full max-w-sm space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.distribution[rating] || 0
                  const percentage = stats.totalReviews > 0 
                    ? (count / stats.totalReviews) * 100 
                    : 0

                  return (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                      <span className="w-12 flex items-center gap-1">
                        {rating} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => {
              const initials = getAvatarInitials(review.customer.name)
              return (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4 mb-3">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.customer.avatar_url || undefined} alt={review.customer.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info e Rating */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{review.customer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(review.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                      </div>
                    </div>

                  {review.comment && (
                    <p className="text-sm mb-4">{review.comment}</p>
                  )}

                  {review.business_response && (
                    <div className="bg-muted p-4 rounded-lg mt-4">
                      <p className="text-sm font-medium mb-2">Resposta da empresa:</p>
                      <p className="text-sm">{review.business_response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
