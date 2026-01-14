'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { User, Mail, Phone, FileText } from 'lucide-react'

interface CustomerFormProps {
  data: {
    name: string
    email: string
    phone: string
    notes: string
  }
  onChange: (data: {
    name: string
    email: string
    phone: string
    notes: string
  }) => void
}

export function CustomerForm({ data, onChange }: CustomerFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: string) => {
    onChange({ ...data, [field]: value })
    
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors }

    switch (field) {
      case 'name':
        if (!value || value.length < 2) {
          newErrors.name = 'Nome deve ter pelo menos 2 caracteres'
        } else {
          delete newErrors.name
        }
        break
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Email inválido'
        } else {
          delete newErrors.email
        }
        break
      case 'phone':
        if (!value || value.length < 9) {
          newErrors.phone = 'Telefone inválido'
        } else {
          delete newErrors.phone
        }
        break
    }

    setErrors(newErrors)
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome completo *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Digite seu nome"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={(e) => validateField('name', e.target.value)}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email (opcional)
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={(e) => validateField('email', e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telefone *
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="912 345 678"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            onBlur={(e) => validateField('phone', e.target.value)}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Observações (opcional)
          </Label>
          <textarea
            id="notes"
            placeholder="Alguma informação adicional..."
            value={data.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {data.notes.length}/500 caracteres
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          * Campos obrigatórios
        </p>
      </div>
    </Card>
  )
}
