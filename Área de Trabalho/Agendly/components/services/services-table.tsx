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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { ServiceFormDialog } from './service-form-dialog'
import { DeleteServiceDialog } from './delete-service-dialog'
import { toggleServiceStatus } from '@/lib/actions/services'
import { useToast } from '@/components/ui/use-toast'

interface Service {
  id: string
  name: string
  description?: string | null
  duration_minutes: number
  price: number
  currency: string
  active: boolean
}

interface ServicesTableProps {
  services: Service[]
  businessId: string
}

export function ServicesTable({ services, businessId }: ServicesTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)

  const handleToggleStatus = async (service: Service) => {
    const result = await toggleServiceStatus(service.id, !service.active)

    if (result.success) {
      toast({
        title: service.active ? 'Serviço desativado' : 'Serviço ativado',
        description: `O serviço "${service.name}" foi ${
          service.active ? 'desativado' : 'ativado'
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

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhum serviço cadastrado ainda.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  {service.description && (
                    <CardDescription className="mt-1">
                      {service.description}
                    </CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingService(service)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(service)}>
                      {service.active ? (
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
                      onClick={() => setDeletingService(service)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {formatPrice(service.price, service.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDuration(service.duration_minutes)}
                  </div>
                </div>
                <Badge variant={service.active ? 'default' : 'secondary'}>
                  {service.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingService && (
        <ServiceFormDialog
          open={!!editingService}
          onOpenChange={(open) => !open && setEditingService(null)}
          businessId={businessId}
          service={editingService}
        />
      )}

      {deletingService && (
        <DeleteServiceDialog
          open={!!deletingService}
          onOpenChange={(open) => !open && setDeletingService(null)}
          service={deletingService}
        />
      )}
    </>
  )
}
