import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { getCustomers } from '@/lib/actions/customers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ClientesPage({
  params,
}: {
  params: { businessId: string }
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getCustomers(params.businessId)

  if (!result.success) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Clientes</h1>
        <p className="text-destructive">Erro ao carregar clientes: {result.error}</p>
      </div>
    )
  }

  const customers = result.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Lista de clientes cadastrados
          </p>
        </div>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhum cliente cadastrado ainda.
            </p>
            <p className="text-sm text-muted-foreground">
              Os clientes são criados automaticamente ao criar agendamentos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer: any) => (
            <Card key={customer.id}>
              <CardHeader>
                <CardTitle>{customer.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Telefone: </span>
                    <span className="font-medium">{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div>
                      <span className="text-muted-foreground">Email: </span>
                      <span className="font-medium">{customer.email}</span>
                    </div>
                  )}
                  {customer.notes && (
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground">Notas: </span>
                      <span>{customer.notes}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
