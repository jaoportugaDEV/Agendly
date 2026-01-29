import { redirect } from 'next/navigation'
import { getClientProfile } from '@/lib/actions/client-auth'
import { ClientProfileForm } from '@/components/client/client-profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ClientProfilePage() {
  const result = await getClientProfile()

  if (!result.success || !result.data) {
    redirect('/entrar')
  }

  const customer = result.data

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-8">
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
            Atualize sua foto de perfil e informações de contato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientProfileForm customer={customer} />
        </CardContent>
      </Card>
    </div>
  )
}
