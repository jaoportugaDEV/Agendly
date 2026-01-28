import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { getBusinessMembers } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { StaffTable } from '@/components/staff/staff-table'
import { StaffFormDialog } from '@/components/staff/staff-form-dialog'
import { HelpTooltip } from '@/components/help-tooltip'
import { OnboardingTour } from '@/components/onboarding-tour'
import { equipeTourSteps } from '@/lib/tours/dashboard-tours'

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
    <>
      <OnboardingTour steps={equipeTourSteps} tourKey="equipe" />
      
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Equipe</h1>
            <HelpTooltip content="Adicione funcionários, gerencie horários de trabalho, controle ausências e defina permissões de admin." />
          </div>
          <StaffFormDialog
            businessId={params.businessId}
            trigger={
              <Button className="tour-add-staff">
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Funcionário
              </Button>
            }
          />
        </div>

        <div className="tour-staff-card">
          <StaffTable members={members} businessId={params.businessId} />
        </div>
      </div>
    </>
  )
}
