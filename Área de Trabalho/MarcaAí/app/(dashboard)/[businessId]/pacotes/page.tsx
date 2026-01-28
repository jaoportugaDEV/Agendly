import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getBusinessPackages } from '@/lib/actions/packages'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, TrendingDown } from 'lucide-react'
import { CreatePackageDialog } from '@/components/admin/create-package-dialog'
import { DeletePackageButton } from '@/components/admin/delete-package-button'

export default async function PackagesPage({
  params,
}: {
  params: { businessId: string }
}) {
  const supabase = await createClient()

  // Verificar se usuário é admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', params.businessId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    redirect(`/${params.businessId}`)
  }

  // Buscar pacotes e serviços
  const [packagesResult, servicesResult] = await Promise.all([
    getBusinessPackages(params.businessId),
    supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .eq('business_id', params.businessId)
      .eq('active', true)
      .is('deleted_at', null)
      .order('name')
  ])

  const packages = packagesResult.success ? packagesResult.data : []
  const services = servicesResult.data || []

  // Buscar moeda do negócio
  const { data: business } = await supabase
    .from('businesses')
    .select('currency')
    .eq('id', params.businessId)
    .single()

  const currency = business?.currency || 'EUR'

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pacotes e Combos</h1>
          <p className="text-muted-foreground">
            Crie pacotes promocionais para aumentar suas vendas
          </p>
        </div>
        <CreatePackageDialog 
          businessId={params.businessId}
          services={services}
          currency={currency}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pacotes Ativos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Desconto Médio
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.length > 0
                ? `${Math.round(
                    packages.reduce((acc, pkg: any) => {
                      const discount = ((pkg.original_price - pkg.package_price) / pkg.original_price) * 100
                      return acc + discount
                    }, 0) / packages.length
                  )}%`
                : '0%'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Economia Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                packages.reduce((acc: number, pkg: any) => 
                  acc + (pkg.original_price - pkg.package_price), 0
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packages List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Seus Pacotes</h2>
        {packages.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum pacote criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro pacote para oferecer combos e promoções
              </p>
              <CreatePackageDialog 
                businessId={params.businessId}
                services={services}
                currency={currency}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg: any) => {
              const discount = Math.round(((pkg.original_price - pkg.package_price) / pkg.original_price) * 100)
              
              return (
                <Card key={pkg.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        {pkg.description && (
                          <CardDescription className="mt-1">
                            {pkg.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        -{discount}%
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Preços */}
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {formatCurrency(pkg.package_price)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(pkg.original_price)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Economize {formatCurrency(pkg.original_price - pkg.package_price)}
                      </p>
                    </div>

                    {/* Serviços inclusos */}
                    <div>
                      <p className="text-sm font-medium mb-2">Serviços inclusos:</p>
                      <ul className="text-sm space-y-1">
                        {pkg.services?.map((service: any) => (
                          <li key={service.id} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {service.name}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Detalhes */}
                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                      {pkg.max_uses && (
                        <p>Máximo de usos: {pkg.max_uses}</p>
                      )}
                      {pkg.validity_days && (
                        <p>Validade: {pkg.validity_days} dias</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex gap-2">
                      <DeletePackageButton packageId={pkg.id} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
