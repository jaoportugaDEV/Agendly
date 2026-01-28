import { redirect } from 'next/navigation'
import { getAuthenticatedClient } from '@/lib/utils/jwt'
import { getClientAppointments } from '@/lib/actions/client-appointments'
import { getClientProfile } from '@/lib/actions/client-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LogOut, Calendar, Clock, MapPin, User } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { logoutClient } from '@/lib/actions/client-auth'

async function handleLogout() {
  'use server'
  await logoutClient()
  redirect('/entrar')
}

export default async function ClientDashboardPage() {
  const auth = await getAuthenticatedClient()
  
  if (!auth) {
    redirect('/entrar')
  }

  const [profileResult, futureResult, pastResult] = await Promise.all([
    getClientProfile(),
    getClientAppointments({ status: 'future' }),
    getClientAppointments({ status: 'past' })
  ])

  const profile = profileResult.success ? profileResult.data : null
  const futureAppointments = futureResult.success ? futureResult.data : []
  const pastAppointments = pastResult.success ? pastResult.data : []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Meus Agendamentos</h1>
            <p className="text-sm text-muted-foreground">
              Olá, {profile?.name || 'Cliente'}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <form action={handleLogout}>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="future" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="future">
              Próximos ({futureAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Histórico ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="future" className="mt-6 space-y-4">
            {futureAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Você não tem agendamentos futuros
                  </p>
                </CardContent>
              </Card>
            ) : (
              futureAppointments.map((apt: any) => (
                <Card key={apt.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{apt.business?.name}</CardTitle>
                        <CardDescription>{apt.service?.name}</CardDescription>
                      </div>
                      <div className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                        ${apt.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {apt.status === 'confirmed' && 'Confirmado'}
                        {apt.status === 'cancelled' && 'Cancelado'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(apt.start_time), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(apt.start_time), 'HH:mm', { locale: ptBR })} 
                        {' '}({apt.service?.duration_minutes} min)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{apt.staff?.full_name}</span>
                    </div>
                    {apt.business?.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">{apt.business.address}</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/meus-agendamentos/${apt.id}`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6 space-y-4">
            {pastAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Você ainda não tem histórico de agendamentos
                  </p>
                </CardContent>
              </Card>
            ) : (
              pastAppointments.map((apt: any) => (
                <Card key={apt.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{apt.business?.name}</CardTitle>
                        <CardDescription>{apt.service?.name}</CardDescription>
                      </div>
                      {apt.review && (
                        <div className="text-sm text-muted-foreground">
                          ⭐ {apt.review.rating}/5
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(apt.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/meus-agendamentos/${apt.id}`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                      {!apt.review && apt.status === 'completed' && (
                        <Button asChild variant="default" size="sm">
                          <Link href={`/avaliar/${apt.id}`}>
                            Avaliar
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
