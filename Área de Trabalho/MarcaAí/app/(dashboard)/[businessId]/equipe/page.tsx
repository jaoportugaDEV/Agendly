import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { getBusinessMembers } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { StaffTable } from '@/components/staff/staff-table'
import { StaffFormDialog } from '@/components/staff/staff-form-dialog'

export default async function EquipePage({
  params,
}: {
  params: { businessId: string }
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getBusinessMembers(params.businessId)

  if (!result.success) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Equipe</h1>
        <p className="text-destructive">Erro ao carregar equipe: {result.error}</p>
      </div>
    )
  }

  const members = result.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Equipe</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os membros da sua equipe e suas funções
          </p>
        </div>
        <StaffFormDialog
          businessId={params.businessId}
          trigger={
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Funcionário
            </Button>
          }
        />
      </div>

      <StaffTable members={members} businessId={params.businessId} />
    </div>
  )
}
