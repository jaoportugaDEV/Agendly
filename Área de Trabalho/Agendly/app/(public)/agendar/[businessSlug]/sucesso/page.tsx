import { createPublicClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Calendar, Clock, User, Mail, Phone, ArrowRight, Star } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface PageProps {
  params: { businessSlug: string }
  searchParams: { id?: string }
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: PageProps) {
  const appointmentId = searchParams.id

  if (!appointmentId) {
    notFound()
  }

  const supabase = createPublicClient()

  // Buscar dados do agendamento
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status,
      price,
      currency,
      business:businesses(id, name, slug, phone, email, address, city),
      service:services(name, duration_minutes),
      staff:users(full_name),
      customer:customers(name, email, phone)
    `)
    .eq('id', appointmentId)
    .single()

  if (error || !appointment) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Agendamento Confirmado! 🎉</h1>
          <p className="text-muted-foreground text-lg">
            Seu horário foi reservado com sucesso
          </p>
        </div>

        {/* Appointment Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{appointment.business?.name}</CardTitle>
            <CardDescription>Detalhes do seu agendamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Data e Horário</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(appointment.start_time), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(appointment.start_time), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Serviço</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.service?.name} ({appointment.service?.duration_minutes} min)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Profissional</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.staff?.full_name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Valor</p>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat('pt-PT', {
                      style: 'currency',
                      currency: appointment.currency,
                    }).format(appointment.price)}
                  </p>
                </div>
              </div>
            </div>

            {appointment.business?.address && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-1">Endereço:</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.business.address}
                  {appointment.business.city && `, ${appointment.business.city}`}
                </p>
              </div>
            )}

            {appointment.business?.phone && (
              <div>
                <p className="text-sm font-medium mb-1">Contato:</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.business.phone}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action - Create Account */}
        <Card className="mb-6 border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Crie sua conta gratuita
            </CardTitle>
            <CardDescription>
              E tenha controle total dos seus agendamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Com uma conta você pode:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>✓ Ver todo seu histórico de agendamentos</li>
                <li>✓ Cancelar ou remarcar online (até 24h antes)</li>
                <li>✓ Baixar comprovantes em PDF</li>
                <li>✓ Avaliar seus atendimentos</li>
                <li>✓ Gerenciar tudo em um só lugar</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link href={`/registrar?email=${appointment.customer?.email || ''}&phone=${appointment.customer?.phone || ''}&from=booking&redirect=${appointment.business?.slug || ''}`}>
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/site/${appointment.business?.slug}`}>
                  Voltar ao Site
                </Link>
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Já tem conta?{' '}
              <Link href="/entrar" className="text-primary hover:underline">
                Entrar aqui
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">📱 Importante:</p>
              <ul className="space-y-1 ml-4">
                <li>• Chegue com 5 minutos de antecedência</li>
                <li>• Em caso de imprevisto, entre em contato</li>
                <li>• Guarde este código de agendamento: <span className="font-mono text-foreground">{appointmentId.slice(0, 8)}</span></li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Back to Business */}
        <div className="text-center mt-8">
          <Button asChild variant="ghost">
            <Link href={`/site/${appointment.business?.slug}`}>
              ← Voltar para {appointment.business?.name}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: 'Agendamento Confirmado',
    description: 'Seu agendamento foi confirmado com sucesso',
  }
}
