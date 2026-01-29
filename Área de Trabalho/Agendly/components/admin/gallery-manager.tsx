'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { addGalleryImage, removeGalleryImage } from '@/lib/actions/public-site'
import { Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { validateImageFile } from '@/lib/validations/public-site'
import type { GalleryImage } from '@/types/public-site'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface GalleryManagerProps {
  businessId: string
  initialImages: GalleryImage[]
}

export function GalleryManager({ businessId, initialImages }: GalleryManagerProps) {
  const { toast } = useToast()
  const [images, setImages] = useState<GalleryImage[]>(initialImages)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
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

    // Upload
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('caption', caption)

      const result = await addGalleryImage(businessId, formData)

      if (result.success && result.data) {
        toast({
          title: 'Sucesso',
          description: 'Imagem adicionada à galeria',
        })
        setImages([...images, result.data])
        setCaption('')
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao adicionar imagem',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao enviar',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (imageId: string) => {
    try {
      const result = await removeGalleryImage(imageId)

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Imagem removida da galeria',
        })
        setImages(images.filter((img) => img.id !== imageId))
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao remover imagem',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao remover',
        variant: 'destructive',
      })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label>Adicionar Fotos à Galeria</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Máximo 2MB por imagem
            </p>
          </div>

          <div>
            <Label htmlFor="caption">Legenda (opcional)</Label>
            <Input
              id="caption"
              placeholder="Descrição da foto..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              disabled={loading}
            />
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="gallery-upload"
            />
            <Label htmlFor="gallery-upload">
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
                      Selecionar Imagem
                    </>
                  )}
                </span>
              </Button>
            </Label>
          </div>
        </div>
      </Card>

      {/* Gallery Grid */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Fotos da Galeria</h3>

        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma foto na galeria
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione fotos acima para começar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="relative aspect-square overflow-hidden rounded-lg border">
                  <Image
                    src={image.image_url}
                    alt={image.caption || 'Gallery image'}
                    fill
                    className="object-cover"
                  />
                </div>

                {image.caption && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {image.caption}
                  </p>
                )}

                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setDeleteId(image.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover imagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A imagem será removida permanentemente da galeria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
