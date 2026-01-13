'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBusinessSchema, type CreateBusinessInput } from '@/lib/validations/business'
import { createBusiness } from '@/lib/actions/business'
import { detectCountryFromBrowser } from '@/lib/utils/country'
import { COUNTRIES } from '@/types/shared'
import type { CountryCode } from '@/types/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const BUSINESS_TYPES = [
  'Salão de Beleza',
  'Barbearia',
  'Clínica Médica',
  'Clínica Odontológica',
  'Petshop',
  'Estúdio de Tatuagem',
  'Oficina Mecânica',
  'Consultoria',
  'Academia',
  'Estúdio de Fotografia',
  'Outro',
]

export function OnboardingWizard() {
  const [isLoading, setIsLoading] = useState(false)
  const [detectedCountry, setDetectedCountry] = useState<CountryCode>('PT')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBusinessInput>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      countryCode: 'PT',
      businessType: '',
      name: '',
      description: '',
      phone: '',
      email: '',
    },
  })

  const selectedCountry = watch('countryCode') || 'PT'
  const selectedBusinessType = watch('businessType') || ''

  useEffect(() => {
    // Detect country on mount
    detectCountryFromBrowser().then((country) => {
      setDetectedCountry(country)
      setValue('countryCode', country)
    })
  }, [setValue])

  const onSubmit = async (data: CreateBusinessInput) => {
    setIsLoading(true)
    try {
      console.log('Dados do formulário:', data)
      const result = await createBusiness(data)
      if (result?.error) {
        console.error('Erro ao criar empresa:', result.error)
        toast.error(result.error)
        setIsLoading(false)
      }
      // Se não há erro, o redirect acontece automaticamente na action
    } catch (error) {
      console.error('Erro exception:', error)
      toast.error('Ocorreu um erro ao criar a empresa')
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Bem-vindo ao Agendly!</CardTitle>
        <CardDescription className="text-center">
          Vamos configurar sua empresa em alguns passos simples
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* País */}
          <div className="space-y-2">
            <Label htmlFor="countryCode">País *</Label>
            <Select
              value={selectedCountry}
              onValueChange={(value) => setValue('countryCode', value as CountryCode, { shouldValidate: true })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o país" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(COUNTRIES).map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name} ({country.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.countryCode && (
              <p className="text-sm text-destructive">{errors.countryCode.message}</p>
            )}
          </div>

          {/* Nome da Empresa */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Minha Empresa"
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Tipo de Negócio */}
          <div className="space-y-2">
            <Label htmlFor="businessType">Tipo de Negócio *</Label>
            <Select
              value={selectedBusinessType}
              onValueChange={(value) => setValue('businessType', value, { shouldValidate: true })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de negócio" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.businessType && (
              <p className="text-sm text-destructive">{errors.businessType.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              type="text"
              placeholder="Breve descrição do seu negócio"
              {...register('description')}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={selectedCountry === 'BR' ? '(11) 98765-4321' : '+351 912 345 678'}
              {...register('phone')}
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email da Empresa (opcional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="contato@minhaempresa.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Criando empresa...' : 'Criar Empresa'}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
