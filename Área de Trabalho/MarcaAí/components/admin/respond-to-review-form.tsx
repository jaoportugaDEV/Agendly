'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { respondToReview } from '@/lib/actions/reviews'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RespondToReviewFormProps {
  reviewId: string
}

export function RespondToReviewForm({ reviewId }: RespondToReviewFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!response.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite uma resposta',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const result = await respondToReview(reviewId, response)

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: result.message || 'Resposta enviada com sucesso',
      })
      setShowForm(false)
      setResponse('')
      router.refresh()
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Erro ao enviar resposta',
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
        Responder
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Sua resposta:
        </label>
        <Textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Escreva sua resposta à avaliação..."
          rows={3}
          disabled={loading}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} size="sm">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar Resposta
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setShowForm(false)
            setResponse('')
          }}
          disabled={loading}
          size="sm"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
