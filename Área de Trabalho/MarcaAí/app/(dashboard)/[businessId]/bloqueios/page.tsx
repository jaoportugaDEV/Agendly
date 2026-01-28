import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getBusinessBlocks, getBusinessStaff, getBusinessServices } from '@/lib/actions/schedule-blocks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Wrench, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreateBlockDialog } from '@/components/admin/create-block-dialog'
import { DeleteBlockButton } from '@/components/admin/delete-block-button'

export default async function BlocksPage({
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

  // Buscar dados
  const [blocksResult, staffResult, servicesResult] = await Promise.all([
    getBusinessBlocks(params.businessId),
    getBusinessStaff(params.businessId),
    getBusinessServices(params.businessId)
  ])

  const blocks = blocksResult.success ? blocksResult.data : []
  const staff = staffResult.success ? staffResult.data : []
  const services = servicesResult.success ? servicesResult.data : []

  // Separar bloqueios por tipo
  const activeBlocks = blocks.filter((b: any) => {
    const endDate = new Date(b.end_date)
    return endDate >= new Date()
  })

  const pastBlocks = blocks.filter((b: any) => {
    const endDate = new Date(b.end_date)
    return endDate < new Date()
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bloqueios de Horários</h1>
          <p className="text-muted-foreground">
            Gerencie bloqueios de horários e indisponibilidades
          </p>
        </div>
        <CreateBlockDialog 
          businessId={params.businessId}
          staff={staff}
          services={services}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bloqueios Ativos
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBlocks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bloqueios Passados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastBlocks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blocks.filter((b: any) => b.block_type === 'recurring').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Blocks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Bloqueios Ativos</h2>
        {activeBlocks.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Nenhum bloqueio ativo
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeBlocks.map((block: any) => (
              <BlockCard key={block.id} block={block} />
            ))}
          </div>
        )}
      </div>

      {/* Past Blocks */}
      {pastBlocks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Bloqueios Passados</h2>
          <div className="grid gap-4">
            {pastBlocks.map((block: any) => (
              <BlockCard key={block.id} block={block} isPast />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BlockCard({ block, isPast = false }: { block: any; isPast?: boolean }) {
  const blockTypeLabel = block.block_type === 'recurring' ? 'Recorrente' : 'Único'
  const blockTypeColor = block.block_type === 'recurring' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'

  return (
    <Card className={isPast ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {block.reason || 'Bloqueio sem motivo especificado'}
            </CardTitle>
            <CardDescription>
              Criado por {block.created_by_user?.full_name || 'Sistema'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className={blockTypeColor}>
              {blockTypeLabel}
            </Badge>
            {!isPast && <DeleteBlockButton blockId={block.id} />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Período */}
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <span className="font-medium">Período: </span>
            {format(new Date(block.start_date), "dd/MM/yyyy", { locale: ptBR })}
            {' até '}
            {format(new Date(block.end_date), "dd/MM/yyyy", { locale: ptBR })}
          </div>
        </div>

        {/* Horário */}
        {!block.all_day && block.start_time && block.end_time && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
            </span>
          </div>
        )}

        {block.all_day && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Dia inteiro</span>
          </div>
        )}

        {/* Staff */}
        {block.staff ? (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Funcionário: {block.staff.full_name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Todos os funcionários</span>
          </div>
        )}

        {/* Service */}
        {block.service && (
          <div className="flex items-center gap-2 text-sm">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span>Serviço: {block.service.name}</span>
          </div>
        )}

        {/* Recurrence */}
        {block.block_type === 'recurring' && block.recurrence_pattern && (
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            Padrão de recorrência: {JSON.stringify(block.recurrence_pattern)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
