import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getBusinessReviews, getReviewStats } from '@/lib/actions/reviews'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RespondToReviewForm } from '@/components/admin/respond-to-review-form'
import { ReviewVisibilityToggle } from '@/components/admin/review-visibility-toggle'
import { HelpTooltip } from '@/components/help-tooltip'
import { OnboardingTour } from '@/components/onboarding-tour'
import { avaliacoesTourSteps } from '@/lib/tours/dashboard-tours'
import { getAvatarInitials } from '@/lib/validations/avatar'

export default async function ReviewsPage({
  params,
}: {
  params: { businessId: string }
}) {
  const supabase = await createClient()

  // Verificar se usuário é admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', params.businessId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    redirect(`/${params.businessId}`)
  }

  // Buscar reviews e estatísticas
  const [reviewsResult, statsResult] = await Promise.all([
    getBusinessReviews(params.businessId, { limit: 50 }),
    getReviewStats(params.businessId)
  ])

  const reviews = reviewsResult.success ? reviewsResult.data : []
  const stats = statsResult.success ? statsResult.data : {
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  }

  // Separar reviews respondidas e não respondidas
  const unanswered = reviews.filter((r: any) => !r.business_response)
  const answered = reviews.filter((r: any) => r.business_response)

  return (
    <>
      <OnboardingTour steps={avaliacoesTourSteps} tourKey="avaliacoes" />
      
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Avaliações</h1>
          <HelpTooltip content="Acompanhe as avaliações dos clientes, responda comentários e controle quais aparecem no site público." />
        </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 tour-stats">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avaliação Média
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              De 5 estrelas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              Avaliações recebidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendentes de Resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unanswered.length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando resposta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Estrelas */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating as keyof typeof stats.distribution] || 0
              const percentage = stats.totalReviews > 0 
                ? (count / stats.totalReviews) * 100 
                : 0

              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="w-12 flex items-center gap-1 text-sm">
                    {rating} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm text-muted-foreground">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Tabs defaultValue="unanswered">
        <TabsList>
          <TabsTrigger value="unanswered">
            Pendentes ({unanswered.length})
          </TabsTrigger>
          <TabsTrigger value="answered">
            Respondidas ({answered.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas ({reviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unanswered" className="space-y-4 mt-4">
          {unanswered.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  Nenhuma avaliação pendente de resposta
                </p>
              </CardContent>
            </Card>
          ) : (
            unanswered.map((review: any) => (
              <ReviewCard key={review.id} review={review} showRespondForm />
            ))
          )}
        </TabsContent>

        <TabsContent value="answered" className="space-y-4 mt-4">
          {answered.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  Nenhuma avaliação respondida ainda
                </p>
              </CardContent>
            </Card>
          ) : (
            answered.map((review: any) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  Nenhuma avaliação ainda
                </p>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review: any) => (
              <ReviewCard key={review.id} review={review} showRespondForm={!review.business_response} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
    </>
  )
}

function ReviewCard({ review, showRespondForm = false }: { review: any; showRespondForm?: boolean }) {
  const initials = getAvatarInitials(review.customer?.name || 'Cliente')
  
  return (
    <Card>
      <CardHeader>
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={review.customer?.avatar_url || undefined} alt={review.customer?.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{review.customer?.name}</CardTitle>
                <Badge variant={review.is_public ? 'default' : 'secondary'}>
                  {review.is_public ? 'Pública' : 'Privada'}
                </Badge>
              </div>
              <CardDescription>
                {format(new Date(review.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                {review.staff && ` • Atendido por ${review.staff.full_name}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="tour-visibility-toggle">
                <ReviewVisibilityToggle reviewId={review.id} isPublic={review.is_public} />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {review.comment && (
          <div>
            <p className="text-sm">{review.comment}</p>
          </div>
        )}

        {review.business_response ? (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Sua resposta:</p>
            <p className="text-sm">{review.business_response}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Respondido em {format(new Date(review.responded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        ) : showRespondForm ? (
          <RespondToReviewForm reviewId={review.id} />
        ) : null}
      </CardContent>
    </Card>
  )
}
