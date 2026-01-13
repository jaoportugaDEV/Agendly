'use client'

import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Business {
  id: string
  name: string
  slug: string
}

interface BusinessSwitcherProps {
  businesses: Business[]
  currentBusinessId: string
}

export function BusinessSwitcher({
  businesses,
  currentBusinessId,
}: BusinessSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const currentBusiness = businesses.find((b) => b.id === currentBusinessId)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{currentBusiness?.name || 'Selecione uma empresa'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] p-0">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs">
          Suas Empresas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {businesses.map((business) => (
          <DropdownMenuItem
            key={business.id}
            onSelect={() => {
              router.push(`/${business.id}`)
              setOpen(false)
            }}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                'mr-2 h-4 w-4',
                currentBusinessId === business.id ? 'opacity-100' : 'opacity-0'
              )}
            />
            <span className="truncate">{business.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            router.push('/onboarding')
            setOpen(false)
          }}
          className="cursor-pointer"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Nova Empresa</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
