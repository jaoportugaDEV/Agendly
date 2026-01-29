'use client'

import { useState } from 'react'
import { AvatarUploader } from '@/components/ui/avatar-uploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadCustomerAvatar, removeCustomerAvatar } from '@/lib/actions/avatar'
import { updateClientProfile } from '@/lib/actions/client-auth'
import { getAvatarInitials } from '@/lib/validations/avatar'
import { Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface ClientProfileFormProps {
  customer: {
    id: string
    name: string
    email?: string | null
    phone: string
    avatar_url?: string | null
  }
}

export function ClientProfileForm({ customer }: ClientProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: customer.name,
    email: customer.email || '',
    phone: customer.phone
  })

  const initials = getAvatarInitials(customer.name)

  const handleUpload = async (formData: FormData) => {
    const result = await uploadCustomerAvatar(customer.id, formData)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  const handleRemove = async () => {
    const result = await removeCustomerAvatar(customer.id)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateClientProfile({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone
      })

      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message || 'Perfil atualizado com sucesso.',
        })
        router.refresh()
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível atualizar o perfil.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar */}
      <div className="flex justify-center">
        <AvatarUploader
          currentAvatarUrl={customer.avatar_url}
          fallback={initials}
          onUpload={handleUpload}
          onRemove={handleRemove}
          size="xl"
        />
      </div>

      {/* Informações */}
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome Completo *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Seu nome completo"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="seu@email.com"
          />
          <p className="text-xs text-muted-foreground">
            Usado para enviar notificações e confirmações
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
            required
          />
        </div>
      </div>

      {/* Botão de salvar */}
      <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar Alterações
      </Button>
    </form>
  )
}
