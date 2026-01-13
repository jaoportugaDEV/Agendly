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
} from 'lucide-react'
import { RemoveStaffDialog } from './remove-staff-dialog'
import { ScheduleDialog } from './schedule-dialog'
import { toggleStaffStatus } from '@/lib/actions/staff'
import { useToast } from '@/components/ui/use-toast'

interface StaffMember {
  id: string
  user_id: string
  role: 'admin' | 'staff'
  active: boolean
  joined_at: string
  users: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    phone: string | null
  }
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

  const handleToggleStatus = async (member: StaffMember) => {
    const result = await toggleStaffStatus(businessId, member.id, !member.active)

    if (result.success) {
      toast({
        title: member.active ? 'Funcionário desativado' : 'Funcionário ativado',
        description: `${member.users.full_name || member.users.email} foi ${
          member.active ? 'desativado' : 'ativado'
        } com sucesso.`,
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

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.users.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(member.users.full_name, member.users.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {member.users.full_name || 'Sem nome'}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {member.users.email}
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleToggleStatus(member)}>
                      {member.active ? (
                        <>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <ToggleRight className="mr-2 h-4 w-4" />
                          Ativar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setRemovingMember(member)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
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
                  <div className="text-xs text-muted-foreground">
                    Desde {formatDate(member.joined_at)}
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
          staffName={schedulingMember.users.full_name || schedulingMember.users.email}
        />
      )}
    </>
  )
}
