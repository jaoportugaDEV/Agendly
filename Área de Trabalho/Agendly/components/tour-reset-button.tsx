"use client"

import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'

interface TourResetButtonProps {
  tourKey: string
  label?: string
}

export function TourResetButton({ tourKey, label = "Ver Tutorial" }: TourResetButtonProps) {
  const handleReset = () => {
    localStorage.removeItem(`tour-${tourKey}`)
    window.location.reload()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleReset}>
      <HelpCircle className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}
