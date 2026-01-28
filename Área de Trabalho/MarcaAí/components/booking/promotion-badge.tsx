import { Badge } from '@/components/ui/badge'
import { Percent } from 'lucide-react'

interface PromotionBadgeProps {
  discount: number
  className?: string
}

export function PromotionBadge({ discount, className }: PromotionBadgeProps) {
  return (
    <Badge variant="destructive" className={className}>
      <Percent className="mr-1 h-3 w-3" />
      {Math.round(discount)}% OFF
    </Badge>
  )
}
