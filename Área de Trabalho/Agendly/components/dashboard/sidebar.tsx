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
  Star,
  Package
} from 'lucide-react'

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
    <aside className={cn('flex flex-col h-full bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900', className)}>
      <div className="p-6 border-b border-slate-200/60 dark:border-slate-700/60">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Agendly
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sistema de Agendamentos</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5">
        {menuItems.map((item) => {
          const href = `/${businessId}${item.href}`
          const isActive = pathname === href
          const Icon = item.icon

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/40 hover:text-blue-700 dark:hover:text-blue-300 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20'
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                isActive && "scale-110"
              )} />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-200/60 dark:border-slate-700/60">
        <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
            🚀 Dica do dia
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Use a agenda para visualizar todos os seus compromissos
          </p>
        </div>
      </div>
    </aside>
  )
}
