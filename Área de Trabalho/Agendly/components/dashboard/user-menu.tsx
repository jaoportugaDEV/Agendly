'use client'

import Link from 'next/link'
import { LogOut, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/lib/actions/auth'

interface UserMenuProps {
  user: {
    email?: string
    fullName?: string
    avatarUrl?: string
  }
  businessId?: string
}

export function UserMenu({ user, businessId }: UserMenuProps) {
  const initials = user.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-600 hover:ring-offset-2 transition-all duration-200">
          <Avatar className="border-2 border-blue-200 dark:border-blue-800">
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-blue-200 dark:border-blue-800">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1 p-1">
            <p className="text-sm font-semibold leading-none text-blue-700 dark:text-blue-300">
              {user.fullName}
            </p>
            <p className="text-xs leading-none text-slate-600 dark:text-slate-400">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-blue-200 dark:bg-blue-800" />
        <DropdownMenuItem asChild>
          <Link
            href={businessId ? `/${businessId}/perfil` : '/perfil'}
            className="flex items-center cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 transition-all duration-200"
          >
            <User className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-blue-200 dark:bg-blue-800" />
        <DropdownMenuItem asChild>
          <form action={logout} className="w-full">
            <button type="submit" className="w-full flex items-center cursor-pointer hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-950/30 dark:hover:to-red-950/40 text-red-600 dark:text-red-400 transition-all duration-200">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
