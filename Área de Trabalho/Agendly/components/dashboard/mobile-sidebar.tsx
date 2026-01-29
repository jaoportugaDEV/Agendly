'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'

interface MobileSidebarProps {
  businessId: string
  userRole?: 'admin' | 'staff'
}

export function MobileSidebar({ businessId, userRole = 'admin' }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden hover:bg-blue-50 dark:hover:bg-blue-950/40">
          <Menu className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 border-slate-200 dark:border-slate-700">
        <Sidebar businessId={businessId} userRole={userRole} />
      </SheetContent>
    </Sheet>
  )
}
