'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'
import { createReview } from '@/lib/actions/reviews'
import { useToast } from '@/components/ui/use-toast'

interface CreateReviewFormProps {
  appointmentId: string
  serviceName: string
  staffName?: string
  businessName: string
}

export function CreateReviewForm({
  appointmentId,
  serviceName,
  staffName,
  businessName,
}: CreateReviewFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast({
        title: 'Avaliação obrigatória',
        description: 'Selecione uma classificação de 1 a 5 estrelas',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const result = await createReview({
      appointmentId,
      rating,
      comment: comment.trim() || undefined,
    })

    if (result.success) {
      toast({
        title: 'Avaliação enviada!',
        description: 'Obrigado pelo seu feedback.',
      })
      router.push('/meus-agendamentos')
      router.refresh()
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes do Atendimento</CardTitle>
        <CardDescription>
          <div className="space-y-1 mt-2">
            <p><strong>Serviço:</strong> {serviceName}</p>
            {staffName && <p><strong>Atendido por:</strong> {staffName}</p>}
            <p><strong>Empresa:</strong> {businessName}</p>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Classificação *</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && 'Muito insatisfeito'}
                {rating === 2 && 'Insatisfeito'}
                {rating === 3 && 'Neutro'}
                {rating === 4 && 'Satisfeito'}
                {rating === 5 && 'Muito satisfeito'}
              </p>
            )}
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos sobre sua experiência..."
              rows={5}
              disabled={loading}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/1000 caracteres
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || rating === 0} className="flex-1">
              {loading ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
