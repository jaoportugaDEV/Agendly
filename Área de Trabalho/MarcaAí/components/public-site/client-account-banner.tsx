import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2, ArrowRight, LogIn } from 'lucide-react'

interface ClientAccountBannerProps {
  businessSlug: string
}

export function ClientAccountBanner({ businessSlug }: ClientAccountBannerProps) {
  return (
    <section className="py-8 bg-gradient-to-r from-primary/5 to-primary/10">
      <div className="container">
        <Card className="border-primary/20 bg-white/80 backdrop-blur">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Conteúdo */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-2">
                  Já é nosso cliente? 🎉
                </h3>
                <p className="text-muted-foreground mb-4">
                  Crie uma conta gratuita e tenha controle total dos seus agendamentos
                </p>
                
                {/* Benefícios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Ver histórico completo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Cancelar ou remarcar online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Baixar comprovantes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Avaliar atendimentos</span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button asChild size="lg" className="whitespace-nowrap">
                  <Link href="/registrar">
                    Criar Conta Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="whitespace-nowrap">
                  <Link href="/entrar">
                    <LogIn className="mr-2 h-4 w-4" />
                    Já tenho conta
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
