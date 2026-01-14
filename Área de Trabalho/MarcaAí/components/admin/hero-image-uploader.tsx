'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { uploadHeroImage } from '@/lib/actions/public-site'
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { validateImageFile } from '@/lib/validations/public-site'

interface HeroImageUploaderProps {
  businessId: string
  currentImageUrl?: string
  onUploadSuccess?: (url: string) => void
}

export function HeroImageUploader({
  businessId,
  currentImageUrl,
  onUploadSuccess,
}: HeroImageUploaderProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast({
        title: 'Erro',
        description: validation.error,
        variant: 'destructive',
      })
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadHeroImage(businessId, formData)

      if (result.success && result.data) {
        toast({
          title: 'Sucesso',
          description: 'Imagem enviada com sucesso',
        })
        setPreviewUrl(result.data.url)
        onUploadSuccess?.(result.data.url)
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao enviar imagem',
          variant: 'destructive',
        })
        setPreviewUrl(currentImageUrl || null)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao enviar',
        variant: 'destructive',
      })
      setPreviewUrl(currentImageUrl || null)
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <Label>Imagem Principal (Hero)</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Recomendado: 1920x600px, máximo 2MB
          </p>
        </div>

        {previewUrl ? (
          <div className="relative aspect-[16/5] w-full overflow-hidden rounded-lg border">
            <Image
              src={previewUrl}
              alt="Hero image preview"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center aspect-[16/5] w-full rounded-lg border-2 border-dashed border-muted-foreground/25">
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhuma imagem cadastrada
              </p>
            </div>
          </div>
        )}

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="hero-upload"
          />
          <Label htmlFor="hero-upload">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer"
              asChild
            >
              <span>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {previewUrl ? 'Substituir Imagem' : 'Enviar Imagem'}
                  </>
                )}
              </span>
            </Button>
          </Label>
        </div>
      </div>
    </Card>
  )
}
