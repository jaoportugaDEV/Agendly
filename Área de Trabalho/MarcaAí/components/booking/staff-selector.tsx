'use client'

import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { PublicStaffData } from '@/types/shared'
import { Check, Users } from 'lucide-react'

interface StaffSelectorProps {
  staff: PublicStaffData[]
  selectedStaffId: string | null
  onSelect: (staffId: string) => void
}

export function StaffSelector({
  staff,
  selectedStaffId,
  onSelect,
}: StaffSelectorProps) {
  if (staff.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Nenhum profissional disponível no momento.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Option: Any Available */}
      <Card
        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
          selectedStaffId === 'any'
            ? 'ring-2 ring-primary'
            : ''
        }`}
        onClick={() => onSelect('any')}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Qualquer profissional disponível</h3>
            <p className="text-sm text-muted-foreground">
              Escolher automaticamente
            </p>
          </div>
          {selectedStaffId === 'any' && (
            <div className="flex-shrink-0">
              <div className="rounded-full bg-primary p-1">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Individual staff members */}
      <div className="grid gap-4 md:grid-cols-2">
        {staff.map((member) => {
          const initials = member.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)

          return (
            <Card
              key={member.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedStaffId === member.id
                  ? 'ring-2 ring-primary'
                  : ''
              }`}
              onClick={() => onSelect(member.id)}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.avatar_url} alt={member.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{member.name}</h3>
                </div>
                {selectedStaffId === member.id && (
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-primary p-1">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
