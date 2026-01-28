'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Shield,
  User,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Clock,
  Crown,
  Key,
} from 'lucide-react'
import { RemoveStaffDialog } from './remove-staff-dialog'
import { ScheduleDialog } from './schedule-dialog'
import { DeactivateStaffDialog } from './deactivate-staff-dialog'
import { ResetPasswordDialog } from './reset-password-dialog'
import { reactivateStaffMember } from '@/lib/actions/staff'
import { useToast } from '@/components/ui/use-toast'

interface StaffMember {
  id: string
  user_id: string
  role: 'admin' | 'staff'
  active: boolean
  joined_at: string
  absence_reason: string | null
  absence_start_date: string | null
  absence_end_date: string | null
  absence_notes: string | null
  users: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    phone: string | null
  } | null
}

interface StaffTableProps {
  members: StaffMember[]
  businessId: string
}

export function StaffTable({ members, businessId }: StaffTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [removingMember, setRemovingMember] = useState<StaffMember | null>(null)
  const [schedulingMember, setSchedulingMember] = useState<StaffMember | null>(null)
  const [deactivatingMember, setDeactivatingMember] = useState<StaffMember | null>(null)
  const [resettingPassword, setResettingPassword] = useState<StaffMember | null>(null)

  // Identificar o fundador (primeiro admin)
  const founder = members
    .filter(m => m.role === 'admin')
    .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())[0]

  const isFounder = (member: StaffMember) => {
    return founder && member.user_id === founder.user_id
  }

  const handleReactivate = async (member: StaffMember) => {
    const result = await reactivateStaffMember(businessId, member.id)

    if (result.success) {
      toast({
        title: 'Funcionário reativado',
        description: `${member.users?.full_name || member.users?.email || 'Funcionário'} foi reativado com sucesso.`,
      })
      router.refresh()
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-PT', {
      dateStyle: 'medium',
    }).format(new Date(dateString))
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhum funcionário na equipe ainda.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Filtrar membros sem dados de usuário (usuários deletados)
  const validMembers = members.filter(m => m.users !== null)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {validMembers.map((member) => (
          <Card key={member.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.users?.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(member.users?.full_name, member.users?.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {member.users?.full_name || 'Sem nome'}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {member.users?.email || 'Email não disponível'}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSchedulingMember(member)}>
                      <Clock className="mr-2 h-4 w-4" />
                      Horários de Trabalho
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setResettingPassword(member)}>
                      <Key className="mr-2 h-4 w-4" />
                      Redefinir Senha
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {member.active ? (
                      <DropdownMenuItem onClick={() => setDeactivatingMember(member)}>
                        <ToggleLeft className="mr-2 h-4 w-4" />
                        Marcar Ausência
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleReactivate(member)}>
                        <ToggleRight className="mr-2 h-4 w-4" />
                        Reativar Funcionário
                      </DropdownMenuItem>
                    )}
                    {!isFounder(member) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setRemovingMember(member)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isFounder(member) && (
                      <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-600">
                        <Crown className="h-3 w-3" />
                        Fundador
                      </Badge>
                    )}
                    {member.role === 'admin' ? (
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <User className="h-3 w-3" />
                        Funcionário
                      </Badge>
                    )}
                    <Badge variant={member.active ? 'default' : 'secondary'}>
                      {member.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  {/* Informações de ausência */}
                  {!member.active && member.absence_reason && (
                    <div className="mt-3 p-2 bg-muted rounded-md border text-xs space-y-1">
                      <div className="font-medium text-foreground">
                        {member.absence_reason === 'ferias' && '🏖️ Férias'}
                        {member.absence_reason === 'folga' && '☕ Folga / Descanso'}
                        {member.absence_reason === 'doenca' && '🏥 Doença / Atestado'}
                        {member.absence_reason === 'outro' && '📅 Ausência'}
                      </div>
                      {member.absence_start_date && (
                        <div className="text-muted-foreground">
                          Desde: {formatDate(member.absence_start_date)}
                        </div>
                      )}
                      {member.absence_end_date && (
                        <div className="text-muted-foreground">
                          Retorno: {formatDate(member.absence_end_date)}
                        </div>
                      )}
                      {member.absence_notes && (
                        <div className="text-muted-foreground italic mt-1">
                          "{member.absence_notes}"
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Membro desde {formatDate(member.joined_at)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {removingMember && (
        <RemoveStaffDialog
          open={!!removingMember}
          onOpenChange={(open) => !open && setRemovingMember(null)}
          businessId={businessId}
          member={removingMember}
        />
      )}

      {schedulingMember && (
        <ScheduleDialog
          open={!!schedulingMember}
          onOpenChange={(open) => !open && setSchedulingMember(null)}
          businessId={businessId}
          staffId={schedulingMember.user_id}
          staffName={schedulingMember.users?.full_name || schedulingMember.users?.email || 'Funcionário'}
        />
      )}

      {deactivatingMember && (
        <DeactivateStaffDialog
          open={!!deactivatingMember}
          onOpenChange={(open) => !open && setDeactivatingMember(null)}
          businessId={businessId}
          member={deactivatingMember}
        />
      )}

      {resettingPassword && (
        <ResetPasswordDialog
          open={!!resettingPassword}
          onOpenChange={(open) => !open && setResettingPassword(null)}
          businessId={businessId}
          userId={resettingPassword.user_id}
          userName={resettingPassword.users?.full_name || resettingPassword.users?.email || 'Funcionário'}
        />
      )}
    </>
  )
}
