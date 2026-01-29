import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { ProfileForm } from '@/components/profile/profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ProfilePage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e foto de perfil
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>
            Atualize sua foto de perfil e informações básicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            userId={user.id}
            fullName={user.user_metadata?.full_name || ''}
            email={user.email || ''}
            avatarUrl={user.user_metadata?.avatar_url}
          />
        </CardContent>
      </Card>
    </div>
  )
}
