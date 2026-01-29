import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { getServices } from '@/lib/actions/services'
import { ServicesTable } from '@/components/services/services-table'
import { NewServiceButton } from './new-service-button'

export default async function ServicosPage({
  params,
}: {
  params: { businessId: string }
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getServices(params.businessId)

  if (!result.success) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Serviços</h1>
        <p className="text-destructive">Erro ao carregar serviços: {result.error}</p>
      </div>
    )
  }

  const services = result.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os serviços oferecidos pelo seu negócio
          </p>
        </div>
        <NewServiceButton businessId={params.businessId} />
      </div>

      <ServicesTable services={services} businessId={params.businessId} />
    </div>
  )
}
