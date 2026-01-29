"use client"

import { useEffect } from 'react'

interface CustomizationProviderProps {
  children: React.ReactNode
  colors?: {
    primary: string
    secondary: string
    accent: string
  } | null
}

export function CustomizationProvider({ children, colors }: CustomizationProviderProps) {
  useEffect(() => {
    if (colors) {
      const root = document.documentElement
      
      // Aplicar cores customizadas
      if (colors.primary) {
        root.style.setProperty('--primary', colors.primary)
      }
      if (colors.secondary) {
        root.style.setProperty('--secondary', colors.secondary)
      }
      if (colors.accent) {
        root.style.setProperty('--accent', colors.accent)
      }
    }
  }, [colors])

  return <>{children}</>
}
