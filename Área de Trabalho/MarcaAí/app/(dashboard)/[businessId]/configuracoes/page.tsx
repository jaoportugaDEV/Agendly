import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { getUserBusinesses } from '@/lib/actions/business'
import { DeleteBusinessSection } from '@/components/settings/delete-business-section'

export default async function ConfiguracoesPage({
  params,
}: {
  params: { businessId: string }
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const businesses = await getUserBusinesses()
  const currentBusiness = businesses.find((b) => b.id === params.businessId)

  if (!currentBusiness) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as configurações da sua empresa
        </p>
      </div>

      {/* Zona de perigo - Excluir empresa */}
      <DeleteBusinessSection
        businessId={params.businessId}
        businessName={currentBusiness.name}
      />
    </div>
  )
}
