'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ServiceFormDialog } from '@/components/services/service-form-dialog'

export function NewServiceButton({ businessId }: { businessId: string }) {
  return (
    <ServiceFormDialog
      businessId={businessId}
      trigger={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      }
    />
  )
}
