'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toggleReviewVisibility } from '@/lib/actions/reviews'
import { useToast } from '@/components/ui/use-toast'

interface ReviewVisibilityToggleProps {
  reviewId: string
  isPublic: boolean
}

export function ReviewVisibilityToggle({ reviewId, isPublic }: ReviewVisibilityToggleProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)

    const result = await toggleReviewVisibility(reviewId)

    if (result.success) {
      toast({
        title: 'Visibilidade atualizada',
        description: result.message,
      })
      router.refresh()
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  return (
    <Button
      variant={isPublic ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPublic ? (
        <>
          <Eye className="h-4 w-4 mr-2" />
          Pública
        </>
      ) : (
        <>
          <EyeOff className="h-4 w-4 mr-2" />
          Privada
        </>
      )}
    </Button>
  )
}
