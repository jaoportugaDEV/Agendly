'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Calendar, 
  Users, 
  Scissors, 
  UserCog, 
  Settings,
  LayoutDashboard,
  Globe,
  Ban,
  Star,
  Package
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

interface SidebarProps {
  businessId: string
  className?: string
  userRole?: 'admin' | 'staff' // Novo: role do usuário
}

// Menu completo para admins
const adminMenuItems = [
  {
    title: 'Dashboard',
    href: '',
    icon: LayoutDashboard,
  },
  {
    title: 'Agenda',
    href: '/agenda',
    icon: Calendar,
  },
  {
    title: 'Clientes',
    href: '/clientes',
    icon: Users,
  },
  {
    title: 'Serviços',
    href: '/servicos',
    icon: Scissors,
  },
  {
    title: 'Equipe',
    href: '/equipe',
    icon: UserCog,
  },
  {
    title: 'Site Público',
    href: '/site-publico',
    icon: Globe,
  },
  {
    title: 'Pacotes',
    href: '/pacotes',
    icon: Package,
  },
  {
    title: 'Bloqueios',
    href: '/bloqueios',
    icon: Ban,
  },
  {
    title: 'Avaliações',
    href: '/avaliacoes',
    icon: Star,
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
  },
]

// Menu simplificado para staff
const staffMenuItems = [
  {
    title: 'Minha Agenda',
    href: '/minha-agenda',
    icon: Calendar,
  },
]

export function Sidebar({ businessId, className, userRole = 'admin' }: SidebarProps) {
  const pathname = usePathname()
  
  // Selecionar menu baseado no role
  const menuItems = userRole === 'staff' ? staffMenuItems : adminMenuItems

  return (
    <aside className={cn('flex flex-col h-full', className)}>
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Agendly</h1>
          <ThemeToggle />
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const href = `/${businessId}${item.href}`
          const isActive = pathname === href
          const Icon = item.icon

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
