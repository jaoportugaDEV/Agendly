'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { updatePublicProfile } from '@/lib/actions/public-site'
import { Loader2 } from 'lucide-react'
import type { PublicProfileData } from '@/types/public-site'

interface PublicSiteEditorProps {
  businessId: string
  initialData: PublicProfileData | null
}

export function PublicSiteEditor({ businessId, initialData }: PublicSiteEditorProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    short_description: initialData?.short_description || '',
    full_description: initialData?.full_description || '',
    whatsapp: initialData?.whatsapp || '',
    instagram: initialData?.instagram || '',
    facebook: initialData?.facebook || '',
    website: initialData?.website || '',
    show_address: initialData?.show_address ?? false,
    custom_cta_text: initialData?.custom_cta_text || 'Agendar agora',
    google_maps_url: initialData?.google_maps_url || '',
    address: initialData?.address || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updatePublicProfile(businessId, formData)

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Informações salvas com sucesso',
        })
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao salvar informações',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao salvar',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="contact">Contato</TabsTrigger>
          <TabsTrigger value="cta">Botão</TabsTrigger>
          <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="short_description">Descrição Curta</Label>
                <Textarea
                  id="short_description"
                  placeholder="Breve descrição que aparece no topo do site..."
                  value={formData.short_description}
                  onChange={(e) =>
                    setFormData({ ...formData, short_description: e.target.value })
                  }
                  maxLength={200}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.short_description.length}/200 caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="full_description">Descrição Completa</Label>
                <Textarea
                  id="full_description"
                  placeholder="Descrição detalhada sobre a empresa, história, diferenciais..."
                  value={formData.full_description}
                  onChange={(e) =>
                    setFormData({ ...formData, full_description: e.target.value })
                  }
                  maxLength={2000}
                  rows={8}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.full_description.length}/2000 caracteres
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="351912345678 (apenas números)"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, '') })
                  }
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Apenas números, com código do país
                </p>
              </div>

              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  type="url"
                  placeholder="https://instagram.com/suaempresa"
                  value={formData.instagram}
                  onChange={(e) =>
                    setFormData({ ...formData, instagram: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  type="url"
                  placeholder="https://facebook.com/suaempresa"
                  value={formData.facebook}
                  onChange={(e) =>
                    setFormData({ ...formData, facebook: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://seusite.com"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="address">Endereço (opcional)</Label>
                <Textarea
                  id="address"
                  placeholder="Rua Exemplo, 123&#10;1000-001 Lisboa, Portugal"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  maxLength={300}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Digite o endereço completo do estabelecimento. Será exibido no site com botão "Ver no Google Maps"
                </p>
              </div>

              <div>
                <Label htmlFor="google_maps_url">Link do Google Maps (opcional)</Label>
                <Input
                  id="google_maps_url"
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={formData.google_maps_url}
                  onChange={(e) =>
                    setFormData({ ...formData, google_maps_url: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Para ter o marcador vermelho:</strong> No Google Maps, busque seu estabelecimento → clique em "Compartilhar" → escolha "Incorporar um mapa" → copie APENAS a URL dentro de src="..." do código HTML. 
                  Exemplo: <code className="text-xs">https://www.google.com/maps/embed?pb=!1m18...</code>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_address"
                  checked={formData.show_address}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, show_address: !!checked })
                  }
                />
                <Label htmlFor="show_address" className="cursor-pointer">
                  Mostrar endereço no site público
                </Label>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cta" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom_cta_text">Texto do Botão de Agendamento</Label>
                <Input
                  id="custom_cta_text"
                  placeholder="Agendar agora"
                  value={formData.custom_cta_text}
                  onChange={(e) =>
                    setFormData({ ...formData, custom_cta_text: e.target.value })
                  }
                  maxLength={50}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Texto que aparece nos botões de agendamento
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="p-6">
            <p className="text-muted-foreground">
              Para visualizar o site público, clique no botão "Ver Site Público" no menu lateral.
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </form>
  )
}
