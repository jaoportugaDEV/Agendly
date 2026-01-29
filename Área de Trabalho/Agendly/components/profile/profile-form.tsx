'use client'

import { useState } from 'react'
import { AvatarUploader } from '@/components/ui/avatar-uploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadUserAvatar, removeUserAvatar } from '@/lib/actions/avatar'
import { getAvatarInitials } from '@/lib/validations/avatar'
import { Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface ProfileFormProps {
  userId: string
  fullName: string
  email: string
  avatarUrl?: string
}

export function ProfileForm({ userId, fullName, email, avatarUrl }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName,
    email
  })

  const initials = getAvatarInitials(fullName || email)

  const handleUpload = async (formData: FormData) => {
    const result = await uploadUserAvatar(userId, formData)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  const handleRemove = async () => {
    const result = await removeUserAvatar(userId)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Implementar atualização de nome/email se necessário
      toast({
        title: 'Informação',
        description: 'Atualização de nome/email será implementada em breve.',
      })
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
          currentAvatarUrl={avatarUrl}
          fallback={initials}
          onUpload={handleUpload}
          onRemove={handleRemove}
          size="xl"
        />
      </div>

      {/* Informações */}
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Nome Completo</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Seu nome completo"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            O email não pode ser alterado por questões de segurança
          </p>
        </div>
      </div>

      {/* Botão de salvar (desabilitado por enquanto) */}
      <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar Alterações
      </Button>
    </form>
  )
}
