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
          className="w-full justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-950/60 dark:hover:to-indigo-950/60 transition-all duration-200"
        >
          <span className="truncate font-medium text-blue-700 dark:text-blue-300">
            {currentBusiness?.name || 'Selecione uma empresa'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-blue-600 dark:text-blue-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] p-0 border-blue-200 dark:border-blue-800">
        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40">
          Suas Empresas
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-blue-200 dark:bg-blue-800" />
        {businesses.map((business) => (
          <DropdownMenuItem
            key={business.id}
            onSelect={() => {
              router.push(`/${business.id}`)
              setOpen(false)
            }}
            className={cn(
              "cursor-pointer transition-all duration-200",
              currentBusinessId === business.id
                ? "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950/60 dark:to-indigo-950/60 text-blue-700 dark:text-blue-300 font-medium"
                : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30"
            )}
          >
            <Check
              className={cn(
                'mr-2 h-4 w-4 text-blue-600 dark:text-blue-400',
                currentBusinessId === business.id ? 'opacity-100' : 'opacity-0'
              )}
            />
            <span className="truncate">{business.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-blue-200 dark:bg-blue-800" />
        <DropdownMenuItem
          onSelect={() => {
            router.push('/onboarding')
            setOpen(false)
          }}
          className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 text-blue-600 dark:text-blue-400 font-medium transition-all duration-200"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Nova Empresa</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
