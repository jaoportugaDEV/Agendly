'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GalleryImage } from '@/types/public-site'

interface GallerySectionProps {
  images: GalleryImage[]
}

export function GallerySection({ images }: GallerySectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (images.length === 0) return null

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length)
    }
  }

  const currentImage = selectedIndex !== null ? images[selectedIndex] : null

  return (
    <>
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Galeria
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative aspect-square overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={image.image_url}
                  alt={image.caption || `Foto ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-7xl p-0 border-0">
          {currentImage && (
            <div className="relative w-full h-[80vh] bg-black">
              <Image
                src={currentImage.image_url}
                alt={currentImage.caption || 'Imagem'}
                fill
                className="object-contain"
                sizes="100vw"
              />

              {currentImage.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 text-center">
                  <p>{currentImage.caption}</p>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={closeLightbox}
              >
                <X className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
