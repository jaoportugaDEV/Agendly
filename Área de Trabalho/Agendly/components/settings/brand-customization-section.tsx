"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Image as ImageIcon, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { HelpTooltip } from '@/components/help-tooltip'
import Image from 'next/image'

interface BrandCustomizationSectionProps {
  businessId: string
  currentLogo?: string | null
}

export function BrandCustomizationSection({
  businessId,
  currentLogo,
}: BrandCustomizationSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Selecione uma imagem válida',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'Imagem muito grande. Máximo 2MB',
        variant: 'destructive',
      })
      return
    }

    setLogoFile(file)
  }

  const handleSave = async () => {
    if (!logoFile) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma logo para fazer upload',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', logoFile)
      
      const response = await fetch(`/api/businesses/${businessId}/logo`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      toast({
        title: 'Sucesso',
        description: 'Logo salva com sucesso!',
      })

      setLogoFile(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar logo',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Logo da Empresa
          <HelpTooltip content="Personalize a logo da sua empresa. A logo aparece no dashboard e no site público." />
        </CardTitle>
        <CardDescription>
          Faça upload da logo da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-4">
          {currentLogo && !logoFile && (
            <div className="flex justify-center p-4 border rounded-lg bg-muted/20">
              <Image
                src={currentLogo}
                alt="Logo atual"
                width={200}
                height={200}
                className="rounded object-contain"
              />
            </div>
          )}
          {logoFile && (
            <div className="flex justify-center p-4 border rounded-lg bg-muted/20">
              <Image
                src={URL.createObjectURL(logoFile)}
                alt="Nova logo"
                width={200}
                height={200}
                className="rounded object-contain"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Selecionar Logo</Label>
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              PNG, JPG ou SVG. Máximo 2MB. Recomendado: 400x400px (fundo transparente)
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setLogoFile(null)
              router.refresh()
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !logoFile}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Logo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
