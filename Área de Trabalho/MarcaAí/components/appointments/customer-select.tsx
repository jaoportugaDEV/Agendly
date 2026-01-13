'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { searchCustomers, createCustomer } from '@/lib/actions/customers'
import { useToast } from '@/components/ui/use-toast'
import { Search, Plus, User } from 'lucide-react'

interface CustomerSelectProps {
  businessId: string
  onSelect: (customer: any) => void
  selectedCustomerId?: string
}

export function CustomerSelect({
  businessId,
  onSelect,
  selectedCustomerId,
}: CustomerSelectProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const handleSearch = async () => {
    setSearching(true)
    const result = await searchCustomers(businessId, searchQuery)
    if (result.success) {
      setSearchResults(result.data || [])
    }
    setSearching(false)
  }

  const handleSelectCustomer = (customer: any) => {
    onSelect(customer)
    setOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleCreateCustomer = async () => {
    setCreating(true)
    const result = await createCustomer(businessId, newCustomer)

    if (result.success) {
      toast({
        title: 'Cliente criado',
        description: 'O cliente foi criado com sucesso.',
      })
      onSelect(result.data)
      setOpen(false)
      setShowNewForm(false)
      setNewCustomer({ name: '', email: '', phone: '', notes: '' })
      setSearchQuery('')
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      })
    }
    setCreating(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-start"
      >
        <User className="mr-2 h-4 w-4" />
        {selectedCustomerId ? 'Cliente selecionado' : 'Selecionar cliente'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Selecionar Cliente</DialogTitle>
            <DialogDescription>
              Busque um cliente existente ou crie um novo
            </DialogDescription>
          </DialogHeader>

          {!showNewForm ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {searching && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Buscando...
                </p>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full p-3 text-left rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.phone}
                        {customer.email && ` • ${customer.email}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum cliente encontrado
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewForm(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar novo cliente
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  placeholder="+351 912 345 678"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  placeholder="email@exemplo.com"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewForm(false)}
                  disabled={creating}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={creating || !newCustomer.name || !newCustomer.phone}
                >
                  {creating ? 'Criando...' : 'Criar Cliente'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
