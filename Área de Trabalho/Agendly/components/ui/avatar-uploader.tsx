'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Loader2, X, Upload } from 'lucide-react'
import { validateAvatarFile } from '@/lib/validations/avatar'
import { toast } from '@/components/ui/use-toast'
import { AvatarUploadResult } from '@/types/shared'

interface AvatarUploaderProps {
  currentAvatarUrl?: string | null
  fallback: string
  onUpload: (formData: FormData) => Promise<AvatarUploadResult>
  onRemove?: () => Promise<AvatarUploadResult>
  size?: 'sm' | 'md' | 'lg' | 'xl'
  editable?: boolean
  showRemoveButton?: boolean
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
  xl: 'h-40 w-40'
}

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-7 w-7'
}

export function AvatarUploader({
  currentAvatarUrl,
  fallback,
  onUpload,
  onRemove,
  size = 'lg',
  editable = true,
  showRemoveButton = true
}: AvatarUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Prioridade: preview (durante upload) > uploadedUrl (após sucesso) > currentAvatarUrl (inicial)
  const displayUrl = previewUrl || uploadedUrl || currentAvatarUrl

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar arquivo
    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      toast({
        title: 'Erro na imagem',
        description: validation.error,
        variant: 'destructive'
      })
      return
    }

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Fazer upload automaticamente
    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await onUpload(formData)

      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: 'Foto de perfil atualizada com sucesso.',
        })
        // Manter a URL retornada para exibir imediatamente
        if (result.url) {
          setUploadedUrl(result.url)
        }
        setPreviewUrl(null) // Limpar preview já que agora temos a URL real
      } else {
        toast({
          title: 'Erro no upload',
          description: result.error || 'Não foi possível fazer upload da imagem.',
          variant: 'destructive'
        })
        setPreviewUrl(null) // Limpar preview em caso de erro
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Erro no upload',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      })
      setPreviewUrl(null)
    } finally {
      setIsLoading(false)
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!onRemove) return

    setIsLoading(true)

    try {
      const result = await onRemove()

      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: 'Foto de perfil removida com sucesso.',
        })
        setPreviewUrl(null)
        setUploadedUrl(null) // Limpar URL após remover
      } else {
        toast({
          title: 'Erro ao remover',
          description: result.error || 'Não foi possível remover a foto.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Remove error:', error)
      toast({
        title: 'Erro ao remover',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClick = () => {
    if (editable && !isLoading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar com overlay de upload */}
      <div className="relative group">
        <Avatar className={sizeClasses[size]} key={displayUrl || 'no-avatar'}>
          <AvatarImage 
            src={displayUrl || undefined} 
            alt="Avatar"
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-lg">
            {fallback}
          </AvatarFallback>
        </Avatar>

        {/* Overlay de upload (apenas quando editável) */}
        {editable && (
          <button
            onClick={handleClick}
            disabled={isLoading}
            className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
            type="button"
          >
            {isLoading ? (
              <Loader2 className={`${iconSizeClasses[size]} animate-spin text-white`} />
            ) : (
              <Camera className={`${iconSizeClasses[size]} text-white`} />
            )}
          </button>
        )}

        {/* Input de arquivo oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={!editable || isLoading}
        />
      </div>

      {/* Botões de ação */}
      {editable && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={isLoading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {displayUrl ? 'Alterar foto' : 'Adicionar foto'}
          </Button>

          {showRemoveButton && displayUrl && onRemove && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={isLoading}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <X className="h-4 w-4" />
              Remover
            </Button>
          )}
        </div>
      )}

      {/* Texto de ajuda */}
      {editable && (
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          JPEG, PNG ou WebP. Máximo 1MB.
        </p>
      )}
    </div>
  )
}
