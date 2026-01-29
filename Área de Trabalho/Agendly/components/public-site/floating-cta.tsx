'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

interface FloatingCTAProps {
  businessSlug: string
  ctaText?: string
}

export function FloatingCTA({ businessSlug, ctaText = 'Agendar agora' }: FloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling 300px
      setIsVisible(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 md:hidden">
      <Link href={`/agendar/${businessSlug}`} className="w-full max-w-md">
        <Button 
          size="lg" 
          className="w-full shadow-lg flex items-center gap-2"
        >
          <Calendar className="h-5 w-5" />
          {ctaText}
        </Button>
      </Link>
    </div>
  )
}
