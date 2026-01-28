"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Palette, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { HelpTooltip } from '@/components/help-tooltip'
import Image from 'next/image'
import { hexToHsl } from '@/lib/utils/colors'

interface BrandCustomizationSectionProps {
  businessId: string
  currentLogo?: string | null
  currentColors?: {
    primary: string
    secondary: string
    accent: string
  }
}

export function BrandCustomizationSection({
  businessId,
  currentLogo,
  currentColors,
}: BrandCustomizationSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [colors, setColors] = useState({
    primary: currentColors?.primary || '#3b82f6',
    secondary: currentColors?.secondary || '#f1f5f9',
    accent: currentColors?.accent || '#f1f5f9',
  })

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
    setLoading(true)

    try {
      // Upload logo se houver
      if (logoFile) {
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
      }

      // Salvar cores (converter HEX para HSL)
      const hslColors = {
        primary: hexToHsl(colors.primary),
        secondary: hexToHsl(colors.secondary),
        accent: hexToHsl(colors.accent),
      }

      const colorsResponse = await fetch(`/api/businesses/${businessId}/colors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors: hslColors }),
      })

      if (!colorsResponse.ok) {
        const error = await colorsResponse.json()
        throw new Error(error.error || 'Erro ao salvar cores')
      }

      toast({
        title: 'Sucesso',
        description: 'Customização salva com sucesso!',
      })

      setLogoFile(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar customização',
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
          <Palette className="h-5 w-5" />
          Identidade Visual
          <HelpTooltip content="Personalize o logo e cores da sua marca. As mudanças afetam o dashboard e o site público." />
        </CardTitle>
        <CardDescription>
          Customize a aparência do seu dashboard e site público
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Logo da Empresa</Label>
          {currentLogo && !logoFile && (
            <div className="mb-4">
              <Image
                src={currentLogo}
                alt="Logo atual"
                width={120}
                height={120}
                className="rounded border object-contain"
              />
            </div>
          )}
          {logoFile && (
            <div className="mb-4">
              <Image
                src={URL.createObjectURL(logoFile)}
                alt="Nova logo"
                width={120}
                height={120}
                className="rounded border object-contain"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="cursor-pointer"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG ou SVG. Máximo 2MB. Recomendado: 400x400px
          </p>
        </div>

        {/* Color Pickers */}
        <div className="space-y-4">
          <Label>Cores da Marca</Label>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primary-color" className="flex items-center gap-2">
                Cor Principal
                <HelpTooltip content="Cor usada em botões, links e elementos principais" />
              </Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={colors.primary}
                  onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.primary}
                  onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color" className="flex items-center gap-2">
                Cor Secundária
                <HelpTooltip content="Cor para backgrounds e elementos secundários" />
              </Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={colors.secondary}
                  onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.secondary}
                  onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                  placeholder="#f1f5f9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent-color" className="flex items-center gap-2">
                Cor de Destaque
                <HelpTooltip content="Cor para badges, notificações e elementos de destaque" />
              </Label>
              <div className="flex gap-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={colors.accent}
                  onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.accent}
                  onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                  placeholder="#f1f5f9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-4 space-y-2">
          <Label>Pré-visualização</Label>
          <div className="flex gap-2 flex-wrap">
            <Button style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
              Botão Principal
            </Button>
            <Button variant="secondary" style={{ backgroundColor: colors.secondary, color: '#111827' }}>
              Botão Secundário
            </Button>
            <div
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: colors.accent, color: '#111827' }}
            >
              Badge
            </div>
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
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Customização
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
